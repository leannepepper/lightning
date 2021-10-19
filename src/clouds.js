import * as THREE from 'three'
import cloudVertexShader from './shaders/cloudVertexShader.glsl'
import cloudFragmentShader from './shaders/cloudFragmentShader.glsl'

const cloudGeometry = new THREE.PlaneGeometry(50, 30)

export function createClouds (time) {
  const cloudMaterial = new THREE.ShaderMaterial({
    vertexShader: cloudVertexShader,
    fragmentShader: cloudFragmentShader,
    uniforms: {
      u_resolution: {
        value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        u_time: time
      }
    }
  })

  const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial)
  clouds.position.y = -1
  clouds.position.z = -10
  return clouds
}
