// 3D 渲染模块统一导出
export { Material } from './Material';
export type { MaterialType, MaterialConfig, TextureChannel } from './Material';
export { createUnlitMaterial, createLambertMaterial, createPhongMaterial, createPBRMaterial, createTransparentMaterial, createEmissiveMaterial } from './Material';

export { Light, DirectionalLight, PointLight, SpotLight, LightManager } from './Lighting';
export type { LightType, LightConfig, DirectionalLightConfig, PointLightConfig, SpotLightConfig } from './Lighting';

export { Mesh, createPlaneMesh, createCubeMesh, createSphereMesh, createCylinderMesh } from './Mesh';
export type { VertexLayout, MeshData } from './Mesh';

export { PostProcess, PostProcessPipeline } from './PostProcess';
export type { PostProcessType, PostProcessConfig } from './PostProcess';
