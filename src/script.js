import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'dat.gui'
import { MeshLine, MeshLineMaterial } from '../node_modules/meshline'
import SimplexNoise from 'simplex-noise'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()
const noiseScale = 1000
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
// Material
const material = new THREE.MeshStandardMaterial()
material.roughness = 0.4

const meshlineMaterial = new MeshLineMaterial({
  color: new THREE.Color('#fcfbfb')
})

// MeshLine

function createMainStrike () {
  const array = []
  for (let j = 0; j < 50; j++) {
    // use Noise to create a jagged line
    const noiseDelta = noise.noise3D(0, j * 0.3, 0) * 0.05
    array.push(noiseDelta, j * 0.05, 0)
  }

  const line = new MeshLine()
  line.setPoints(array, p => 0.05)
  const mainStrikeMesh = new THREE.Mesh(line, meshlineMaterial)
  scene.add(mainStrikeMesh)
}

function createBranch (startPoint) {
  const array = []

  for (let k = 0; k < 15; k++) {
    const branchStart = startPoint * 0.05
    const noiseBranchDelta = noise.noise3D(k, k * 0.01, 0) * 1.5
    array.push(
      (k + noiseBranchDelta) * 0.05,
      branchStart + (branchStart - k * 5.0) * 0.01,
      0
    )
  }
  const branch = new MeshLine()
  branch.setPoints(array, p => 0.01)
  const branchStrikeMesh = new THREE.Mesh(branch, meshlineMaterial)
  scene.add(branchStrikeMesh)
}

createMainStrike()
createBranch(35)
createBranch(10)

const plane = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), material)
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
 * Animate
 */
const clock = new THREE.Clock()

const tick = () => {
  const elapsedTime = clock.getElapsedTime()

  // Update controls
  controls.update()

  // Render
  renderer.render(scene, camera)

  // Call tick again on the next frame
  window.requestAnimationFrame(tick)
}

tick()
