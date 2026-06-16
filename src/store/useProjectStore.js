import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { JOURNEY_COLORS } from '../lib/colors'
import { supabase } from '../supabaseClient'
import { enqueue, getQueue, replayAll, clearQueue } from '../lib/syncQueue'

// ── Column mappers ────────────────────────────────────────────────────────────

function journeyFromDB(row) {
  return { id: row.id, name: row.name, color: row.color, createdAt: row.created_at, ownerId: row.owner_id }
}

function nodeFromDB(row) {
  return {
    id:          row.id,
    journeyId:   row.journey_id,
    parentId:    row.parent_id,
    type:        row.type,
    content:     row.content,
    checked:     row.checked,
    assignedTo:  row.assigned_to,
    dueDate:     row.due_date,
    order:       row.sort_order,
    description: row.description,
    diagram:     row.diagram,
    attachments: row.attachments || [],
  }
}

function msgFromDB(row) {
  return {
    id:        row.id,
    userId:    row.user_id,
    username:  row.username,
    text:      row.text,
    timestamp: row.timestamp,
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

const useProjectStore = create(
  persist(
    (set, get) => ({
      journeys: [],
      nodes: {}, // { [journeyId]: Node[] }
      activities: [],
      taskMessages: {},    // { [taskId]: Message[] }
      journeyMessages: {}, // { [journeyId]: Message[] }
      joinedJourneys: [],  // journey IDs the user joined via invite code
      teamMembers: {},     // { [journeyId]: Member[] }

      // ── Production chat (chats + messages tables) ──────────────────────────
      chats: {},       // { [journeyId]: chatId }
      chatMessages: {}, // { [chatId]: Message[] }
      chatHasMore: {},  // { [chatId]: boolean }

      loading: false,
      pendingCount: getQueue().length,

      // Record a joined journey and register in journey_members table
      async joinJourney(journeyId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        set(s => ({
          joinedJourneys: s.joinedJourneys.includes(journeyId)
            ? s.joinedJourneys
            : [...s.joinedJourneys, journeyId],
        }))

        // Get username from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .maybeSingle()

        await supabase.from('journey_members').upsert({
          journey_id: journeyId,
          user_id:    user.id,
          username:   profile?.username || user.email?.split('@')[0] || 'user',
          role:       'viewer',
        }, { onConflict: 'journey_id,user_id' })
      },

      // Fetch all data for the current user from Supabase
      async loadData() {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch journeys owned by this user (explicit filter works with open SELECT RLS)
        const { data: ownRows, error: jErr } = await supabase
          .from("journeys")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at");

        if (jErr) {
          console.error("journeys fetch:", jErr);
          return;
        }

        // Also fetch any journeys joined via invite code
        const ownIds = (ownRows || []).map(j => j.id)
        const foreignIds = (get().joinedJourneys || []).filter(id => !ownIds.includes(id))
        let joinedRows = []
        if (foreignIds.length > 0) {
          const { data } = await supabase.from("journeys").select("*").in("id", foreignIds)
          joinedRows = data || []
        }

        const jRows = [...(ownRows || []), ...joinedRows]
        const journeys = jRows.map(journeyFromDB);
        const journeyIds = journeys.map((j) => j.id);

        // nodes
        let nodesByJourney = {};
        if (journeyIds.length > 0) {
          const { data: nRows } = await supabase
            .from("nodes")
            .select("*")
            .in("journey_id", journeyIds)
            .order("sort_order");

          for (const j of journeys) {
            nodesByJourney[j.id] = (nRows || [])
              .filter((n) => n.journey_id === j.id)
              .map(nodeFromDB);
          }
        } else {
          for (const j of journeys) nodesByJourney[j.id] = [];
        }

        // activities
        const { data: actRows } =
          journeyIds.length > 0
            ? await supabase
                .from("activities")
                .select("*")
                .in("journey_id", journeyIds)
                .order("timestamp", { ascending: false })
                .limit(50)
            : { data: [] };

        set({
          journeys,
          nodes: nodesByJourney,
          activities: (actRows || []).map((a) => ({
            id: a.id,
            journeyId: a.journey_id,
            username: a.username,
            action: a.action,
            timestamp: a.timestamp,
          })),
        });
      },

      // ── Journeys ──────────────────────────────────────────────────────────

      createJourney(name, userId) {
        const id = crypto.randomUUID();
        const color =
          JOURNEY_COLORS[get().journeys.length % JOURNEY_COLORS.length];
        const journey = {
          id,
          name,
          color,
          ownerId: userId,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          journeys: [...s.journeys, journey],
          nodes: { ...s.nodes, [id]: [] },
        }));

        // Get owner's username for the members table
        supabase.from('profiles').select('username').eq('id', userId).maybeSingle()
          .then(({ data: profile }) => {
            supabase.from('journey_members').insert({
              journey_id: id,
              user_id:    userId,
              username:   profile?.username || 'owner',
              role:       'owner',
            }).then(({ error }) => { if (error) console.error('owner member insert:', error) })
          })

        supabase
          .from("journeys")
          .insert({
            id,
            name,
            color,
            owner_id: userId,
            created_at: journey.createdAt,
          })
          .then(({ error }) => {
            if (error) console.error("journey insert:", error);
          });

        return id;
      },

      updateJourney(journeyId, updates) {
        set((s) => ({
          journeys: s.journeys.map((j) =>
            j.id === journeyId ? { ...j, ...updates } : j,
          ),
        }));
        const entry = { table: 'journeys', op: 'update', data: updates, filter: { id: journeyId } }
        if (!navigator.onLine) {
          enqueue(entry)
          set({ pendingCount: getQueue().length })
          return
        }
        supabase
          .from("journeys")
          .update(updates)
          .eq("id", journeyId)
          .then(({ error }) => {
            if (error) {
              console.error("journey update:", error)
              enqueue(entry)
              set({ pendingCount: getQueue().length })
            }
          });
      },

      deleteJourney(journeyId) {
        set((s) => {
          const { [journeyId]: _, ...rest } = s.nodes;
          return {
            journeys: s.journeys.filter((j) => j.id !== journeyId),
            nodes: rest,
            activities: s.activities.filter((a) => a.journeyId !== journeyId),
          };
        });
        supabase
          .from("journeys")
          .delete()
          .eq("id", journeyId)
          .then(({ error }) => {
            if (error) console.error("journey delete:", error);
          });
      },

      // ── Team members ──────────────────────────────────────────────────────

      async fetchTeamMembers(journeyId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const journey = get().journeys.find(j => j.id === journeyId)
        const isOwner = journey?.ownerId === user.id

        // 1. Upsert the current visiting user so they always appear
        //    (covers invited users who joined before the table existed)
        const { data: myProfile } = await supabase
          .from('profiles').select('username').eq('id', user.id).maybeSingle()
        if (myProfile) {
          const { data: existing } = await supabase
            .from('journey_members').select('role')
            .eq('journey_id', journeyId).eq('user_id', user.id).maybeSingle()
          if (!existing) {
            await supabase.from('journey_members').insert({
              journey_id: journeyId,
              user_id:    user.id,
              username:   myProfile.username,
              role:       isOwner ? 'owner' : 'viewer',
            })
          }
        }

        // 2. Also ensure the owner row exists (in case owner never visited Team page)
        if (!isOwner && journey?.ownerId) {
          const { data: ownerProfile } = await supabase
            .from('profiles').select('username').eq('id', journey.ownerId).maybeSingle()
          if (ownerProfile) {
            const { data: ownerRow } = await supabase
              .from('journey_members').select('role')
              .eq('journey_id', journeyId).eq('user_id', journey.ownerId).maybeSingle()
            if (!ownerRow) {
              await supabase.from('journey_members').insert({
                journey_id: journeyId,
                user_id:    journey.ownerId,
                username:   ownerProfile.username,
                role:       'owner',
              })
            }
          }
        }

        // 3. Auto-sync anyone found in activities but not yet a member
        const { data: members0 } = await supabase
          .from('journey_members').select('username').eq('journey_id', journeyId)
        const { data: actRows } = await supabase
          .from('activities').select('username').eq('journey_id', journeyId)
        const existingNames = new Set((members0 || []).map(m => m.username))
        const missingNames  = [...new Set((actRows || []).map(a => a.username))]
          .filter(u => u && !existingNames.has(u))
        if (missingNames.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles').select('id, username').in('username', missingNames)
          for (const p of (profiles || [])) {
            await supabase.from('journey_members').upsert({
              journey_id: journeyId,
              user_id:    p.id,
              username:   p.username,
              role:       'viewer',
            }, { onConflict: 'journey_id,user_id' })
          }
        }

        // 4. Final fetch
        const { data: final, error } = await supabase
          .from('journey_members').select('*').eq('journey_id', journeyId).order('joined_at')
        if (error) { console.error('fetch members:', error); return }
        set(s => ({
          teamMembers: {
            ...s.teamMembers,
            [journeyId]: (final || []).map(m => ({
              id:       m.id,
              userId:   m.user_id,
              username: m.username,
              role:     m.role,
              joinedAt: m.joined_at,
            })),
          },
        }))
      },

      async addMember(journeyId, username) {
        const { data: profile } = await supabase
          .from('profiles').select('id, username').eq('username', username.trim()).maybeSingle()
        if (!profile) throw new Error(`No user found with username "${username.trim()}"`)

        const { error } = await supabase.from('journey_members').upsert({
          journey_id: journeyId,
          user_id:    profile.id,
          username:   profile.username,
          role:       'viewer',
        }, { onConflict: 'journey_id,user_id' })
        if (error) throw new Error(error.message)

        set(s => {
          const existing = s.teamMembers[journeyId] || []
          if (existing.find(m => m.userId === profile.id)) return {}
          return {
            teamMembers: {
              ...s.teamMembers,
              [journeyId]: [...existing, {
                id:       crypto.randomUUID(),
                userId:   profile.id,
                username: profile.username,
                role:     'viewer',
                joinedAt: new Date().toISOString(),
              }],
            },
          }
        })
      },

      async updateMemberRole(journeyId, userId, role) {
        // Optimistic update
        set(s => ({
          teamMembers: {
            ...s.teamMembers,
            [journeyId]: (s.teamMembers[journeyId] || []).map(m =>
              m.userId === userId ? { ...m, role } : m
            ),
          },
        }))
        const { error } = await supabase
          .from('journey_members')
          .update({ role })
          .eq('journey_id', journeyId)
          .eq('user_id', userId)
        if (error) console.error('update role:', error)
      },

      async removeMember(journeyId, userId) {
        set(s => ({
          teamMembers: {
            ...s.teamMembers,
            [journeyId]: (s.teamMembers[journeyId] || []).filter(m => m.userId !== userId),
          },
        }))
        const { error } = await supabase
          .from('journey_members')
          .delete()
          .eq('journey_id', journeyId)
          .eq('user_id', userId)
        if (error) console.error('remove member:', error)
      },

      // ── Nodes ─────────────────────────────────────────────────────────────

      addNode(journeyId, parentId, type, content) {
        const nodes = get().nodes[journeyId] || [];
        const siblings = nodes.filter((n) => n.parentId === parentId);
        const node = {
          id: crypto.randomUUID(),
          journeyId,
          parentId,
          type,
          content,
          checked: false,
          assignedTo: null,
          dueDate: null,
          order: siblings.length,
        };
        set((s) => ({
          nodes: {
            ...s.nodes,
            [journeyId]: [...(s.nodes[journeyId] || []), node],
          },
        }));

        const dbData = { id: node.id, journey_id: journeyId, parent_id: parentId, type, content, checked: false, sort_order: node.order }
        const entry = { table: 'nodes', op: 'insert', data: dbData }
        if (!navigator.onLine) {
          enqueue(entry)
          set({ pendingCount: getQueue().length })
          return node
        }
        supabase
          .from("nodes")
          .insert(dbData)
          .then(({ error }) => {
            if (error) {
              console.error("node insert:", error)
              enqueue(entry)
              set({ pendingCount: getQueue().length })
            }
          });

        return node;
      },

      updateNode(journeyId, nodeId, updates) {
        set((s) => ({
          nodes: {
            ...s.nodes,
            [journeyId]: s.nodes[journeyId].map((n) =>
              n.id === nodeId ? { ...n, ...updates } : n,
            ),
          },
        }));

        // Map camelCase → snake_case for Supabase
        const dbUp = {};
        if ("content" in updates) dbUp.content = updates.content;
        if ("checked" in updates) dbUp.checked = updates.checked;
        if ("assignedTo" in updates) dbUp.assigned_to = updates.assignedTo;
        if ("dueDate" in updates) dbUp.due_date = updates.dueDate;
        if ("description" in updates) dbUp.description = updates.description;
        if ("diagram" in updates) dbUp.diagram = updates.diagram;
        if ("attachments" in updates) dbUp.attachments = updates.attachments;

        if (Object.keys(dbUp).length > 0) {
          const entry = { table: 'nodes', op: 'update', data: dbUp, filter: { id: nodeId } }
          if (!navigator.onLine) {
            enqueue(entry)
            set({ pendingCount: getQueue().length })
            return
          }
          supabase
            .from("nodes")
            .update(dbUp)
            .eq("id", nodeId)
            .then(({ error }) => {
              if (error) {
                console.error("node update:", error)
                enqueue(entry)
                set({ pendingCount: getQueue().length })
              }
            });
        }
      },

      deleteNode(journeyId, nodeId) {
        const allNodes = get().nodes[journeyId] || [];
        const toDelete = new Set();
        const collect = (id) => {
          toDelete.add(id);
          allNodes
            .filter((n) => n.parentId === id)
            .forEach((n) => collect(n.id));
        };
        collect(nodeId);
        set((s) => ({
          nodes: {
            ...s.nodes,
            [journeyId]: s.nodes[journeyId].filter((n) => !toDelete.has(n.id)),
          },
        }));

        // Cascade deletes handled by FK in DB; just delete the root
        const entry = { table: 'nodes', op: 'delete', filter: { id: nodeId } }
        if (!navigator.onLine) {
          enqueue(entry)
          set({ pendingCount: getQueue().length })
          return
        }
        supabase
          .from("nodes")
          .delete()
          .eq("id", nodeId)
          .then(({ error }) => {
            if (error) {
              console.error("node delete:", error)
              enqueue(entry)
              set({ pendingCount: getQueue().length })
            }
          });
      },

      // ── Activities ────────────────────────────────────────────────────────

      addActivity(journeyId, username, action) {
        const activity = {
          id: crypto.randomUUID(),
          journeyId,
          username,
          action,
          timestamp: new Date().toISOString(),
        };
        set((s) => ({ activities: [activity, ...s.activities].slice(0, 50) }));

        supabase
          .from("activities")
          .insert({
            id: activity.id,
            journey_id: journeyId,
            username,
            action,
            timestamp: activity.timestamp,
          })
          .then(({ error }) => {
            if (error) console.error("activity insert:", error);
          });
      },

      // ── Task messages ─────────────────────────────────────────────────────

      addTaskMessage(taskId, userId, username, text) {
        const msg = {
          id: crypto.randomUUID(),
          userId,
          username,
          text,
          timestamp: new Date().toISOString(),
        };
        set((s) => ({
          taskMessages: {
            ...s.taskMessages,
            [taskId]: [...(s.taskMessages[taskId] || []), msg],
          },
        }));

        supabase
          .from("task_messages")
          .insert({
            id: msg.id,
            task_id: taskId,
            user_id: userId,
            username,
            text,
            timestamp: msg.timestamp,
          })
          .then(({ error }) => {
            if (error) console.error("message insert:", error);
          });
      },

      // ── Journey messages ──────────────────────────────────────────────────────

      addJourneyMessage(journeyId, userId, username, text) {
        const msg = {
          id: crypto.randomUUID(),
          userId,
          username,
          text,
          timestamp: new Date().toISOString(),
        }
        set((s) => ({
          journeyMessages: {
            ...s.journeyMessages,
            [journeyId]: [...(s.journeyMessages[journeyId] || []), msg],
          },
        }))
        supabase
          .from('journey_messages')
          .insert({ id: msg.id, journey_id: journeyId, user_id: userId, username, text, timestamp: msg.timestamp })
          .then(({ error }) => { if (error) console.error('journey msg insert:', error) })
      },

      async fetchJourneyMessages(journeyId) {
        const { data, error } = await supabase
          .from('journey_messages')
          .select('*')
          .eq('journey_id', journeyId)
          .order('timestamp')
        if (error) { console.error('journey messages fetch:', error); return }
        set((s) => ({
          journeyMessages: {
            ...s.journeyMessages,
            [journeyId]: (data || []).map((m) => ({
              id: m.id, userId: m.user_id, username: m.username, text: m.text, timestamp: m.timestamp,
            })),
          },
        }))
      },

      // ── Production chat actions ───────────────────────────────────────────

      async ensureChat(journeyId) {
        if (get().chats[journeyId]) return get().chats[journeyId]

        // Try to find existing chat for this journey
        const { data: existing } = await supabase
          .from('chats')
          .select('id')
          .eq('journey_id', journeyId)
          .maybeSingle()

        if (existing) {
          set(s => ({ chats: { ...s.chats, [journeyId]: existing.id } }))
          return existing.id
        }

        // Create new chat row
        const { data: created, error } = await supabase
          .from('chats')
          .insert({ journey_id: journeyId })
          .select('id')
          .single()

        if (error) { console.error('chat create:', error); return null }
        set(s => ({ chats: { ...s.chats, [journeyId]: created.id } }))
        return created.id
      },

      // PAGE = 30, cursor-based: pass `before` (ISO timestamp) to load older messages
      async fetchMessages(chatId, before = null) {
        const PAGE = 30
        let q = supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: false })
          .limit(PAGE)

        if (before) q = q.lt('created_at', before)

        const { data, error } = await q
        if (error) { console.error('fetch messages:', error); return }

        const msgs = (data || []).reverse().map(m => ({
          id:             m.id,
          chatId:         m.chat_id,
          senderId:       m.sender_id,
          senderUsername: m.sender_username,
          content:        m.content,
          createdAt:      m.created_at,
        }))

        set(s => ({
          chatMessages: {
            ...s.chatMessages,
            [chatId]: before
              ? [...msgs, ...(s.chatMessages[chatId] || [])]
              : msgs,
          },
          chatHasMore: {
            ...s.chatHasMore,
            [chatId]: (data?.length || 0) === PAGE,
          },
        }))
      },

      sendMessage(chatId, senderId, senderUsername, content) {
        const msg = {
          id:             crypto.randomUUID(),
          chatId,
          senderId,
          senderUsername,
          content,
          createdAt:      new Date().toISOString(),
        }
        set(s => ({
          chatMessages: {
            ...s.chatMessages,
            [chatId]: [...(s.chatMessages[chatId] || []), msg],
          },
        }))

        supabase.from('messages').insert({
          id:              msg.id,
          chat_id:         chatId,
          sender_id:       senderId,
          sender_username: senderUsername,
          content,
          created_at:      msg.createdAt,
        }).then(({ error }) => { if (error) console.error('message insert:', error) })

        // Update chat's last_message summary
        supabase.from('chats').update({
          last_message:    content.slice(0, 120),
          last_message_at: msg.createdAt,
          updated_at:      msg.createdAt,
        }).eq('id', chatId).then(({ error }) => { if (error) console.error('chat update:', error) })
      },

      // Called by real-time subscription — deduplicates against optimistic inserts
      addChatMessageFromRealtime(chatId, msg) {
        set(s => {
          const existing = s.chatMessages[chatId] || []
          if (existing.some(m => m.id === msg.id)) return {}
          return {
            chatMessages: {
              ...s.chatMessages,
              [chatId]: [...existing, msg],
            },
          }
        })
      },

      // Fetch messages for one task from Supabase (called lazily when chat tab opens)
      async fetchTaskMessages(taskId) {
        const { data, error } = await supabase
          .from("task_messages")
          .select("*")
          .eq("task_id", taskId)
          .order("timestamp");

        if (error) {
          console.error("messages fetch:", error);
          return;
        }

        set((s) => ({
          taskMessages: {
            ...s.taskMessages,
            [taskId]: (data || []).map(msgFromDB),
          },
        }));
      },
      // ── Offline sync ──────────────────────────────────────────────────────

      async syncData() {
        if (getQueue().length === 0) return
        try {
          await replayAll()
          set({ pendingCount: 0 })
          await get().loadData()
        } catch (err) {
          console.error('Sync failed:', err)
        }
      },
    }),
    {
      name: "pal-projects",
      partialize: (state) => {
        // eslint-disable-next-line no-unused-vars
        const { pendingCount, loading, ...rest } = state
        return rest
      },
    },
  ),
);

export default useProjectStore
