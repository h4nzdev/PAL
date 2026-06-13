installHook.js:1 [locatorjs]: ok
overrideMethod @ installHook.js:1
reload.js:22 WebSocket connection to 'ws://127.0.0.1:8000//ws' failed: 
init @ reload.js:22
installHook.js:1 The result of getSnapshot should be cached to avoid an infinite loop
overrideMethod @ installHook.js:1
react-dom_client.js?v=37bb9f4a:2632 Uncaught Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
    at getRootForUpdatedFiber (react-dom_client.js?v=37bb9f4a:2632:166)
    at enqueueConcurrentRenderForLane (react-dom_client.js?v=37bb9f4a:2622:11)
    at forceStoreRerender (react-dom_client.js?v=37bb9f4a:4580:15)
    at updateStoreInstance (react-dom_client.js?v=37bb9f4a:4562:36)
    at Object.react_stack_bottom_frame (react-dom_client.js?v=37bb9f4a:12903:13)
    at runWithFiberInDEV (react-dom_client.js?v=37bb9f4a:850:66)
    at commitHookEffectListMount (react-dom_client.js?v=37bb9f4a:6616:153)
    at commitHookPassiveMountEffects (react-dom_client.js?v=37bb9f4a:6651:55)
    at commitPassiveMountOnFiber (react-dom_client.js?v=37bb9f4a:7617:22)
    at recursivelyTraversePassiveMountEffects (react-dom_client.js?v=37bb9f4a:7605:5)
installHook.js:1 An error occurred in the <SectionCard> component.

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://react.dev/link/error-boundaries to learn more about error boundaries.

overrideMethod @ installHook.js:1
