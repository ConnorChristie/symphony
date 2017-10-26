'use strict'

// libs
import * as THREE from 'three'
import OrbitContructor from 'three-orbit-controls'
import Config from '../Config'

import {
  ConvexGeometry
} from '../geometries/ConvexGeometry'

let OrbitControls = OrbitContructor(THREE)



export default class Day {
  constructor (blocks) {
    this.blocks = blocks
    this.textureLoader = new THREE.TextureLoader()

    // canvas dimensions
    this.width = window.innerWidth
    this.height = window.innerHeight

    // scene
    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(Config.scene.bgColor, 0.001)

    // renderer
    this.canvas = document.getElementById('stage')
    this.renderer = new THREE.WebGLRenderer({
      antialias: Config.scene.antialias,
      canvas: this.canvas,
      alpha: true
    })

    this.renderer.setClearColor(Config.scene.bgColor, 0.0)

    this.renderer.autoClear = false

    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.width, this.height)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.shadowMap.soft = true
    this.renderer.autoClear = false
    this.renderer.sortObjects = false

    // camera
    this.camera = new THREE.PerspectiveCamera(Config.camera.fov, this.width / this.height, 1, 50000)
    this.camera.position.set(0.0, 25.0, 25.0)
    this.camera.updateMatrixWorld()

    // controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.minDistance = 0
    this.controls.maxDistance = 5000

    window.addEventListener('resize', this.resize.bind(this), false)
    this.resize()

    this.addEvents()

    // objects
    this.addLights()
    this.setupMaterials()
    this.addObjects()

    // animation loop
    this.animate()
  }

  addEvents () {
    this.raycaster = new THREE.Raycaster()
    this.intersected = null
    this.mousePos = new THREE.Vector2()

    document.addEventListener('mousemove', this.onDocumentMouseMove.bind(this), false)
    document.addEventListener('mousedown', this.onDocumentMouseDown.bind(this), false)
  }

  onDocumentMouseDown (event) {
    event.preventDefault()

    this.mousePos.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.raycaster.setFromCamera(this.mousePos, this.camera)

    var intersects = this.raycaster.intersectObjects(this.group.children)

    if (intersects.length > 0) {
      intersects[0].object.material.color.setHex(Math.random() * 0xffffff)
      let hash = intersects[0].object.blockchainData.hash
      document.location.href = '/block/' + hash
    }
  }

  onDocumentMouseMove (event) {
    this.mousePos.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mousePos.y = -(event.clientY / window.innerHeight) * 2 + 1
  }

  addLights (scene) {
    let ambLight = new THREE.AmbientLight(0xf1d0c5)
    this.scene.add(ambLight)

    let light = new THREE.SpotLight(0xeee6a5)
    light.position.set(100, 30, 0)
    light.target.position.set(0, 0, 0)

    if (Config.scene.shadowsOn) {
      light.castShadow = true
      light.shadow = new THREE.LightShadow(new THREE.PerspectiveCamera(50, 1, 500, 15000))
      light.shadow.mapSize.width = 2048
      light.shadow.mapSize.height = 2048
    }

    this.scene.add(light)
  }

  addObjects () {
    this.group = new THREE.Group()
    this.scene.add(this.group)

    for (let i = 0; i < this.blocks.length; i++) {
      let block = this.blocks[i]

      let boxWidth = block.n_tx / 250
      let boxHeight = block.fee / 5000000000

      let geometry = new THREE.BoxBufferGeometry(boxWidth, boxHeight, boxHeight)

      let material = new THREE.MeshPhysicalMaterial({
        color: 0xafbfd9,
        metalness: 0.6,
        roughness: 0.0,
        opacity: 1.0,
        side: THREE.DoubleSide,
        transparent: false,
        envMap: this.bgMap
        // wireframe: true,
      })

      let cube = new THREE.Mesh(geometry, material)

      cube.blockchainData = block

      let rotation = ((2 * Math.PI) / this.blocks.length) * i

      cube.rotation.y = rotation
      cube.translateX(10 + boxWidth / 2)
      cube.translateY(i / 15)

      this.group.add(cube)
    }
  }

  addConvexHull (points) {
    // Convex Hull
    var CVgeometry = new ConvexGeometry(points)
    var CVmaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      opacity: 0.5,
      transparent: true
    })
    var CVmesh = new THREE.Mesh(CVgeometry, CVmaterial)

    CVmesh.rotation.set(0.0, Math.PI, Math.PI)

    this.scene.add(CVmesh)
  }

  setupMaterials () {
    this.cubeMapUrls = [
      'px.png',
      'nx.png',
      'py.png',
      'ny.png',
      'pz.png',
      'nz.png'
    ]

    this.bgMap = new THREE.CubeTextureLoader().setPath('/static/assets/textures/').load(this.cubeMapUrls)

    // this.scene.background = this.bgMap

    this.crystalMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xafbfd9,
      metalness: 0.6,
      roughness: 0.0,
      opacity: 1.0,
      side: THREE.DoubleSide,
      transparent: false,
      envMap: this.bgMap
      // wireframe: true,
    })
  }

  resize () {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.width, this.height)
  }

  render () {
    this.group.rotation.y += 0.0001

    var vector = new THREE.Vector3(this.mousePos.x, this.mousePos.y, 1)
    vector.unproject(this.camera)
    var ray = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize())
    var intersects = ray.intersectObjects(this.group.children)
    if (intersects.length > 0) {
      if (intersects[0].object !== this.intersected) {
        if (this.intersected) {
          this.intersected.material.color.setHex(this.intersected.currentHex)
        }
        this.intersected = intersects[0].object
        this.intersected.currentHex = this.intersected.material.color.getHex()
        this.intersected.material.color.setHex(0xffffff)
      }
    } else {
      if (this.intersected) {
        this.intersected.material.color.setHex(this.intersected.currentHex)
      }
      this.intersected = null
    }

    this.renderer.render(this.scene, this.camera)
    this.controls.update()
  }

  animate () {
    requestAnimationFrame(this.animate.bind(this))
    this.render()
  }
}
