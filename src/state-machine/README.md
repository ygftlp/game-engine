# state-machine — 状态机
FSM（状态 + 带守卫/优先级的转移表 + 历史回退）与 HierarchicalFSM（分层状态）。
状态实现 FSMState 的 onEnter/onUpdate/onExit。适合 Boss AI、角色状态、流程状态。
来源：lite-game-engine ai/StateMachine（测试于进库时新补）。
