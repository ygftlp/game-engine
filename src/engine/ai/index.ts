// AI 系统统一导出
export {
  BTNode, Blackboard, NodeStatus,
  Inverter, Repeater, Timeout,
  Sequence, Selector, RandomSelector, Parallel,
  Condition, Action, BehaviorTree,
  conditionHasKey, conditionGreaterThan, conditionLessThan,
  actionSetBlackboard, actionWait,
} from './BehaviorTree';

export { FSM, FSMState, HierarchicalFSM } from './StateMachine';
export type { Transition, HSMNode } from './StateMachine';

export { GridPathfinder, NavMeshPathfinder } from './Pathfinding';
export type { PathResult, PathfindingConfig, NavTriangle } from './Pathfinding';

export {
  SteeringBehavior, Seek, Pursue, Flee, Arrive,
  CollisionAvoidance, ObstacleAvoidance,
  Separation, Alignment, Cohesion,
  SteeringComposite,
} from './Steering';
export type { SteeringOutput, CollisionInfo, SteeringTarget } from './Steering';
