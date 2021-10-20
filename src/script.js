import * as dat from 'dat.gui'
import SimplexNoise from 'simplex-noise'
import * as THREE from 'three'
import { ShaderLib, UniformsUtils } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { LightningStorm } from 'three/examples/jsm/objects/LightningStorm'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import cloudFragmentShader from './shaders/cloudFragmentShader.glsl'
import cloudVertexShader from './shaders/cloudVertexShader.glsl'
import waterFragmentShader from './shaders/fragment.glsl'
import waterVertexShader from './shaders/vertex.glsl'
import './style.css'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()
const debugObject = {}

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
const camera = new THREE.PerspectiveCamera(
  27,
  window.innerWidth / window.innerHeight,
  20,
  10000
)

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

// Clouds
const loader = new THREE.TextureLoader()

const uTextureShape = loader.load('images/1.jpg')
const uTextureCloudNoise = loader.load('images/2.jpg')

const cloudGeometry = new THREE.PlaneBufferGeometry(10, 10, 5, 5)
const CLOUD_COUNT = 10

const offsets = new Float32Array(CLOUD_COUNT * 3)

for (let i = 0; i < CLOUD_COUNT; i++) {
  const i3 = i * 3

  offsets[i3] = getRandomArbitrary(-20, 20)
  offsets[i3 + 1] = 9.0
  offsets[i3 + 2] = 0.0
}

cloudGeometry.setAttribute(
  'aOffset',
  new THREE.InstancedBufferAttribute(offsets, 3, false, 1)
)

const cloudUniforms = {
  uTime: { value: 0 },
  uTextureCloudNoise: { value: uTextureCloudNoise },
  uTextureShape: { value: uTextureShape },
  uFac1: { value: 17.8 },
  uFac2: { value: 2.7 },
  uTimeFactor1: { value: 0.002 },
  uTimeFactor2: { value: 0.0015 },
  uDisplStrenght1: { value: 0.04 },
  uDisplStrenght2: { value: 0.08 }
}
const cloudMaterial = new THREE.ShaderMaterial({
  uniforms: {
    ...UniformsUtils.clone(ShaderLib.sprite.uniforms),
    ...cloudUniforms
  },
  vertexShader: cloudVertexShader,
  fragmentShader: cloudFragmentShader,
  transparent: true
})

const cloudMesh = new THREE.InstancedMesh(
  cloudGeometry,
  cloudMaterial,
  CLOUD_COUNT
)

scene.add(cloudMesh)

// Colors
debugObject.depthColor = '#263d4d'
debugObject.surfaceColor = '#99c7e8'

// Materials
const waterMaterial = new THREE.ShaderMaterial({
  vertexShader: waterVertexShader,
  fragmentShader: waterFragmentShader,
  uniforms: {
    uBigWavesElevation: { value: 0.106 },
    uBigWavesFrequency: { value: new THREE.Vector2(0.63, 0.413) },
    uTime: { value: 0 },
    uBigWaveSpeed: { value: new THREE.Vector2(0.196, 0.5) },
    uDepthColor: { value: new THREE.Color(debugObject.depthColor) },
    uSurfaceColor: { value: new THREE.Color(debugObject.surfaceColor) },
    uColorOffset: { value: 0.356 },
    uColorMultiplier: { value: 1.714 },
    uSmallWavesElevation: { value: 0.707 },
    uSmallWavesFrequency: { value: 0.264 },
    uSmallWavesSpeed: { value: 0.2 },
    uSmallIterations: { value: 4 }
  }
})

const lightningMaterial = new THREE.MeshBasicMaterial({
  color: new THREE.Color(0xb0ffff)
})

const rayDirection = new THREE.Vector3(0, -1, -1)
let rayLength = 0
const vec1 = new THREE.Vector3()
const vec2 = new THREE.Vector3()

const rayParams = {
  radius0: 0.1,
  radius1: 0.05,
  minRadius: 0.3,
  maxIterations: 7,

  timeScale: 0.05,
  propagationTimeFactor: 0.3,
  vanishingTimeFactor: 1.9,
  subrayPeriod: 4,
  subrayDutyCycle: 0.6,

  maxSubrayRecursion: 3,
  ramification: 3,
  recursionProbability: 0.4,

  roughness: 0.85,
  straightness: 0.65,
  sourceOffset: new THREE.Vector3(0, 2, -1),
  destOffset: new THREE.Vector3(-1, 2, -1),
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
const GROUND_SIZE = 50

// Ground

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE, 512, 512),
  waterMaterial
)
ground.rotation.x = -Math.PI * 0.5
scene.add(ground)

const storm = new LightningStorm({
  size: 0.1,
  minHeight: 9,
  maxHeight: 20,
  maxSlope: 0.6,
  maxLightnings: 2,
  lightningParameters: rayParams,
  lightningMaterial: lightningMaterial
})

function createStorm () {
  scene.add(storm)

  effectComposer.passes = []
  effectComposer.addPass(new RenderPass(scene, camera))
  createOutline(scene, storm.lightningsMeshes, new THREE.Color(0xb0ffff))
}

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
//renderer.outputEncoding = THREE.sRGBEncoding

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
camera.position.set(0, 0.5, 1.5).multiplyScalar(GROUND_SIZE * 0.5)

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
  cloudMaterial.uniforms.uTime.value = elapsedTime

  storm.update(elapsedTime)

  // Render
  //renderer.render(scene, camera)
  effectComposer.render()

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
  i++
}

tick()

/*
 ** Utils
 */
function getRandomArbitrary (min, max) {
  return Math.random() * (max - min) + min
}

/*
 ** DEBUG
 */

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
