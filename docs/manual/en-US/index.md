# Lite Game Engine Documentation

Lite Game Engine is a lightweight 2D game engine for WeChat Mini Games, Douyin Mini Games, and H5 targets. Its real implementation stack is TypeScript, Canvas 2D, and esbuild. This manual documents the actual runtime capabilities, workflows, API surface, and troubleshooting path for production-oriented 2D projects.

## Scope

- Architecture: `Engine`, rendering, input, loading, audio, collision, logging, and platform adapters
- Setup: dependency installation, build commands, project layout, template creation, and debugging tools
- Tutorial: build a runnable 2D scene from scratch
- API reference: grouped by module and public exports
- FAQ: common rendering, performance, script, resource, and platform issues

## Capability Boundaries

This repository is a 2D Canvas engine, not a full 3D engine. The current version does not provide:

- 3D scenes, meshes, skeletal animation, or PBR materials
- Native DirectX 12, Vulkan, or OpenGL 4.5 rendering backends
- Scene, material, or animation editors
- A built-in scripting VM, rigid-body physics world, or networking framework

Rendering depends on the host platform's Canvas 2D implementation. On H5 it runs on the browser graphics stack; on mini-game platforms it runs on the host-provided 2D canvas wrapper.

## Support Matrix

| Category | Current support |
| --- | --- |
| Development OS | Windows, macOS, Linux |
| Runtime targets | H5, WeChat Mini Game, Douyin Mini Game |
| Core language | TypeScript |
| Graphics interface | Canvas 2D |
| Build tool | esbuild |
| Automated testing | Vitest |

## Recommended Hardware

| Scenario | Minimum | Recommended |
| --- | --- | --- |
| Coding and docs | Dual-core CPU, 4GB RAM | Quad-core CPU, 8GB RAM |
| H5 debugging | Integrated GPU, modern browser | Any hardware-accelerated browser |
| Mini-game debugging | Official devtools runs | 8GB+ RAM for smoother rebuild cycles |

## Reading Order

1. Read `architecture.md` to understand module boundaries and data flow
2. Follow `setup.md` to build and run the engine
3. Use `tutorial.md` to create your first playable 2D scene
4. Keep `api.md` and `faq.md` nearby during development

## Deliverables

- Markdown source docs in `docs/manual`
- Static HTML site in `dist/docs`
- PDF manuals in `dist/docs/pdf`
- Starter example in `examples/manual-starter`
- Built example output in `dist/examples/manual-starter` after `npm run example:build`
