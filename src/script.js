import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { LightningStrike } from 'three/examples/jsm/geometries/LightningStrike.js'
import { LightningStorm } from 'three/examples/jsm/objects/LightningStorm'
import SimplexNoise from 'simplex-noise'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass'
import waterVertexShader from './shaders/vertex.glsl'
import waterFragmentShader from './shaders/fragment.glsl'

import './style.css'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()
const debugObject = {}
const noise = new SimplexNoise('seed')

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
}

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
)
camera.position.x = 3
camera.position.y = 1
camera.position.z = 0
scene.add(camera)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

const pointLight = new THREE.PointLight(0xffffff, 0.5)
pointLight.position.x = 2
pointLight.position.y = 3
pointLight.position.z = 2
scene.add(pointLight)

/**
 * Objects
 */

// Colors
debugObject.depthColor = '#11476b'
debugObject.surfaceColor = '#9bd8ff'

// Materials
const waterMaterial = new THREE.ShaderMaterial({
  vertexShader: waterVertexShader,
  fragmentShader: waterFragmentShader,
  uniforms: {
    uBigWavesElevation: { value: 0.2 },
    uBigWavesFrequency: { value: new THREE.Vector2(4, 1.5) },
    uTime: { value: 0 },
    uBigWaveSpeed: { value: new THREE.Vector2(0.75, 0.5) },
    uDepthColor: { value: new THREE.Color(debugObject.depthColor) },
    uSurfaceColor: { value: new THREE.Color(debugObject.surfaceColor) },
    uColorOffset: { value: 0.215 },
    uColorMultiplier: { value: 2.256 },
    uSmallWavesElevation: { value: 0.15 },
    uSmallWavesFrequency: { value: 3 },
    uSmallWavesSpeed: { value: 0.2 },
    uSmallIterations: { value: 4 }
  }
})

const lightningMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color(0xb0ffff)
})

// gui
//   .add(waterMaterial.uniforms.uBigWavesElevation, 'value')
//   .min(0)
//   .max(1)
//   .step(0.001)
//   .name('uBigWavesElevation')
// gui
//   .add(waterMaterial.uniforms.uBigWavesFrequency.value, 'x')
//   .min(0)
//   .max(10)
//   .step(0.001)
//   .name('uBigWavesFrequencyX')
// gui
//   .add(waterMaterial.uniforms.uBigWavesFrequency.value, 'y')
//   .min(0)
//   .max(10)
//   .step(0.001)
//   .name('uBigWavesFrequencyY')
// gui
//   .add(waterMaterial.uniforms.uBigWaveSpeed.value, 'x')
//   .min(0)
//   .max(10)
//   .step(0.001)
//   .name('uBigWaveSpeedX')
// gui
//   .add(waterMaterial.uniforms.uBigWaveSpeed.value, 'y')
//   .min(0)
//   .max(10)
//   .step(0.001)
//   .name('uBigWaveSpeedY')

// gui.addColor(debugObject, 'depthColor').onChange(() => {
//   waterMaterial.uniforms.uDepthColor.value.set(debugObject.depthColor)
// })
// gui.addColor(debugObject, 'surfaceColor').onChange(() => {
//   waterMaterial.uniforms.uSurfaceColor.value.set(debugObject.surfaceColor)
// })
// gui
//   .add(waterMaterial.uniforms.uColorOffset, 'value')
//   .min(0)
//   .max(1)
//   .step(0.001)
//   .name('uColorOffset')
// gui
//   .add(waterMaterial.uniforms.uColorMultiplier, 'value')
//   .min(0)
//   .max(10)
//   .step(0.001)
//   .name('uColorMultiplier')
// gui
//   .add(waterMaterial.uniforms.uSmallWavesElevation, 'value')
//   .min(0)
//   .max(1)
//   .step(0.001)
//   .name('uSmallWavesElevation')
// gui
//   .add(waterMaterial.uniforms.uSmallWavesFrequency, 'value')
//   .min(0)
//   .max(30)
//   .step(0.001)
//   .name('uSmallWavesFrequency')
// gui
//   .add(waterMaterial.uniforms.uSmallWavesSpeed, 'value')
//   .min(0)
//   .max(4)
//   .step(0.001)
//   .name('uSmallWavesSpeed')
// gui
//   .add(waterMaterial.uniforms.uSmallIterations, 'value')
//   .min(0)
//   .max(5)
//   .step(1)
//   .name('uSmallIterations')

// const rayParams = {
//   sourceOffset: new THREE.Vector3(0, 2, 0),
//   destOffset: new THREE.Vector3(0, 0, 0),
//   radius0: 0.01,
//   radius1: 0.005,
//   minRadius: 0.5,
//   maxIterations: 7,
//   isEternal: true,

//   timeScale: 0.7,

//   propagationTimeFactor: 0.05,
//   vanishingTimeFactor: 0.95,
//   subrayPeriod: 3.5,
//   subrayDutyCycle: 0.6,
//   maxSubrayRecursion: 3,
//   ramification: 7,
//   recursionProbability: 0.6,

//   roughness: 0.85,
//   straightness: 0.6
// }
const rayDirection = new THREE.Vector3(0, -1, 0)
let rayLength = 0
const vec1 = new THREE.Vector3()
const vec2 = new THREE.Vector3()

const rayParams = {
  radius0: 0.01,
  radius1: 0.005,
  minRadius: 0.05,
  maxIterations: 7,

  timeScale: 1.15,
  propagationTimeFactor: 0.2,
  vanishingTimeFactor: 0.9,
  subrayPeriod: 4,
  subrayDutyCycle: 0.6,

  maxSubrayRecursion: 3,
  ramification: 3,
  recursionProbability: 0.4,

  roughness: 0.85,
  straightness: 0.65,

  onSubrayCreation: function (
    segment,
    parentSubray,
    childSubray,
    lightningStrike
  ) {
    lightningStrike.subrayConePosition(
      segment,
      parentSubray,
      childSubray,
      0.6,
      0.6,
      0.5
    )

    // Plane projection

    rayLength = lightningStrike.rayParameters.sourceOffset.y
    vec1.subVectors(
      childSubray.pos1,
      lightningStrike.rayParameters.sourceOffset
    )
    const proj = rayDirection.dot(vec1)
    vec2.copy(rayDirection).multiplyScalar(proj)
    vec1.sub(vec2)
    const scale = proj / rayLength > 0.5 ? rayLength / proj : 1
    vec2.multiplyScalar(scale)
    vec1.add(vec2)
    childSubray.pos1.addVectors(
      vec1,
      lightningStrike.rayParameters.sourceOffset
    )
  }
}

const stormParams = {
  size: 20,
  minHeight: 9,
  maxHeight: 20,
  maxSlope: 0.6,
  maxLightnings: 8,
  lightningParameters: rayParams,
  lightningMaterial: lightningMaterial
}

// let lightningStrike // Geometry
// let lightningStrikeMesh
// const outlineMeshArray = []

// function createMainStrike () {
//   if (lightningStrikeMesh) {
//     scene.remove(lightningStrikeMesh)
//   }

//   lightningStrike = new LightningStrike(rayParams)
//   lightningStrikeMesh = new THREE.Mesh(lightningStrike, lightningMaterial)

//   outlineMeshArray.length = 0
//   outlineMeshArray.push(lightningStrikeMesh)

//   scene.add(lightningStrikeMesh)

//   effectComposer.passes = []
//   effectComposer.addPass(new RenderPass(scene, camera))
//   createOutline(scene, outlineMeshArray, new THREE.Color(0xb0ffff))
// }

const storm = new LightningStorm({ stormParams })
function createStorm () {
  scene.add(storm)

  effectComposer.passes = []
  effectComposer.addPass(new RenderPass(scene, camera))
  createOutline(scene, storm.lightningsMeshes, new THREE.Color(0xb0ffff))
}

const waterGeometry = new THREE.PlaneGeometry(20, 20, 512, 512)
const plane = new THREE.Mesh(waterGeometry, waterMaterial)
plane.rotation.x = -Math.PI * 0.5

scene.add(plane)

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth
  sizes.height = window.innerHeight

  // Update camera
  camera.aspect = sizes.width / sizes.height
  camera.updateProjectionMatrix()

  // Update renderer
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding

/**
 * Post Processing
 */
const effectComposer = new EffectComposer(renderer)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
effectComposer.setSize(sizes.width, sizes.height)

function createOutline (scene, objectsArray, visibleColor) {
  const outlinePass = new OutlinePass(
    new THREE.Vector2(sizes.width, sizes.height),
    scene,
    camera,
    objectsArray
  )
  outlinePass.edgeStrength = 2.5
  outlinePass.edgeGlow = 0.7
  outlinePass.edgeThickness = 2.8
  outlinePass.visibleEdgeColor = visibleColor
  outlinePass.hiddenEdgeColor.set(0)
  effectComposer.addPass(outlinePass)

  //  scene.userData.outlineEnabled = true

  return outlinePass
}
camera.position.set(0, 0.2, 1.6).multiplyScalar(20 * 0.5)

createStorm()

/**
 * Animate
 */
const clock = new THREE.Clock()
let i = 0

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  // Update controls
  controls.update()

  waterMaterial.uniforms.uTime.value = elapsedTime
  storm.update(elapsedTime)

  // Animate Lightning
  if (i % 100 === 0) {
    // createMainStrike()
  }

  // Render
  //renderer.render(scene, camera)
  effectComposer.render()

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
  i++
}

tick()
