import * as THREE from 'three'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { MeshLine, MeshLineMaterial } from '../node_modules/meshline'
import SimplexNoise from 'simplex-noise'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass'
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js'
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

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

const pointLight = new THREE.PointLight(0xffffff, 0.5)
pointLight.position.x = 2
pointLight.position.y = 3
pointLight.position.z = 4
scene.add(pointLight)

/**
 * Objects
 */

// Colors
debugObject.depthColor = '#11476b'
debugObject.surfaceColor = '#9bd8ff'

// Material
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

gui
  .add(waterMaterial.uniforms.uBigWavesElevation, 'value')
  .min(0)
  .max(1)
  .step(0.001)
  .name('uBigWavesElevation')
gui
  .add(waterMaterial.uniforms.uBigWavesFrequency.value, 'x')
  .min(0)
  .max(10)
  .step(0.001)
  .name('uBigWavesFrequencyX')
gui
  .add(waterMaterial.uniforms.uBigWavesFrequency.value, 'y')
  .min(0)
  .max(10)
  .step(0.001)
  .name('uBigWavesFrequencyY')
gui
  .add(waterMaterial.uniforms.uBigWaveSpeed.value, 'x')
  .min(0)
  .max(10)
  .step(0.001)
  .name('uBigWaveSpeedX')
gui
  .add(waterMaterial.uniforms.uBigWaveSpeed.value, 'y')
  .min(0)
  .max(10)
  .step(0.001)
  .name('uBigWaveSpeedY')

gui.addColor(debugObject, 'depthColor').onChange(() => {
  waterMaterial.uniforms.uDepthColor.value.set(debugObject.depthColor)
})
gui.addColor(debugObject, 'surfaceColor').onChange(() => {
  waterMaterial.uniforms.uSurfaceColor.value.set(debugObject.surfaceColor)
})
gui
  .add(waterMaterial.uniforms.uColorOffset, 'value')
  .min(0)
  .max(1)
  .step(0.001)
  .name('uColorOffset')
gui
  .add(waterMaterial.uniforms.uColorMultiplier, 'value')
  .min(0)
  .max(10)
  .step(0.001)
  .name('uColorMultiplier')
gui
  .add(waterMaterial.uniforms.uSmallWavesElevation, 'value')
  .min(0)
  .max(1)
  .step(0.001)
  .name('uSmallWavesElevation')
gui
  .add(waterMaterial.uniforms.uSmallWavesFrequency, 'value')
  .min(0)
  .max(30)
  .step(0.001)
  .name('uSmallWavesFrequency')
gui
  .add(waterMaterial.uniforms.uSmallWavesSpeed, 'value')
  .min(0)
  .max(4)
  .step(0.001)
  .name('uSmallWavesSpeed')
gui
  .add(waterMaterial.uniforms.uSmallIterations, 'value')
  .min(0)
  .max(5)
  .step(1)
  .name('uSmallIterations')

const meshlineMaterial = new MeshLineMaterial({
  color: new THREE.Color('#fcfbfb')
})

// MeshLine

let mainStrikeMesh
const NUM_POINTS = 50

function createMainStrike () {
  const geometry = new THREE.BufferGeometry()
  let points = new Float32Array(NUM_POINTS * 3)

  for (let i = 0; i < NUM_POINTS; i++) {
    const i3 = i * 3
    // use Noise to create a jagged line
    const noiseDelta = noise.noise3D(0, i * 0.3, 0) * 0.05

    points[i3] = noiseDelta
    points[i3 + 1] = i * 0.05
    points[i3 + 2] = 0
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(points, 3))
  const lineMaterial = new THREE.LineBasicMaterial({
    color: '#fcfbfb',
    linewidth: 10
  })
  mainStrikeMesh = new THREE.Line(geometry, lineMaterial)
  scene.add(mainStrikeMesh)
}

function createBranch (startPoint, horizontalSpread) {
  const array = []

  for (let k = 0; k < 15; k++) {
    const branchStart = startPoint * 0.05
    const noiseBranchDelta = noise.noise3D(k, k * 0.01, 0) * 1.5
    array.push(
      (k + noiseBranchDelta) * horizontalSpread,
      branchStart + (branchStart - k * 5.0) * 0.01,
      0
    )
  }
  const branch = new MeshLine()
  branch.setPoints(array, p => 0.01)
  const branchStrikeMesh = new THREE.Mesh(branch, meshlineMaterial)
  scene.add(branchStrikeMesh)
}

const waterGeometry = new THREE.PlaneGeometry(2, 2, 512, 512)
const plane = new THREE.Mesh(waterGeometry, waterMaterial)
plane.rotation.x = -Math.PI * 0.5

scene.add(plane)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
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
camera.position.x = 0
camera.position.y = 1
camera.position.z = 5
scene.add(camera)

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

/**
 * Post Processing
 */

// TODO: figure out how to do the post processing for a bloom on the lightning strike
const effectComposer = new EffectComposer(renderer)
effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
effectComposer.setSize(sizes.width, sizes.height)

const renderPass = new RenderPass(scene, camera)
effectComposer.addPass(renderPass)

const lightningStikePass = new BloomPass(
  1, // strength
  25, // kernel size
  4, // sigma ?
  256 // blur render target resolution
)
// lightningStikePass.renderToScreen = true
// effectComposer.addPass(lightningStikePass)

// Create Scene
createMainStrike()

createBranch(35, 0.05)
createBranch(10, -0.06)

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  // Update controls
  controls.update()

  waterMaterial.uniforms.uTime.value = elapsedTime

  // Render
  //renderer.render(scene, camera)
  effectComposer.render()

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
