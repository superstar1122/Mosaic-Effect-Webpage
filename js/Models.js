// Models.js
import * as THREE from 'three'
import { gsap } from 'gsap'

export default class Models {
  constructor(gl_app) {
    this.scene = gl_app.scene
    this.group = new THREE.Group()
    this.scene.add(this.group)

    this.gridSize = 42
    this.spacing = 0.6
    this.grids = []
    this._remainingToCreate = 0

    this.grids_config = [
      { id: 'heart', mask: 'heart.jpg', image: 'heart-photo.jpg' },
      { id: 'codrops', mask: 'codrops.jpg', image: 'codrops-photo.jpg' },
      { id: 'smile', mask: 'smile.jpg', image: 'smile-photo.jpg' },
    ]

    // simple lighting for 3D mosaic feel
    const light1 = new THREE.DirectionalLight(0xffffff, 1)
    light1.position.set(1, 1, 2)
    this.scene.add(light1)
    const light2 = new THREE.AmbientLight(0x666666)
    this.scene.add(light2)

    this._remainingToCreate = this.grids_config.length
    this.grids_config.forEach(cfg => this._createMaskAndGrid(cfg))
    this.group.scale.setScalar(0.08)
  }

  _createMaskAndGrid(config) {
    const maskImg = new Image()
    maskImg.crossOrigin = 'anonymous'
    maskImg.onload = () => {
      const aspect = maskImg.width / maskImg.height
      this.gridWidth = this.gridSize
      this.gridHeight = Math.round(this.gridSize / aspect)

      const canvas = document.createElement('canvas')
      canvas.width = this.gridWidth
      canvas.height = this.gridHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(maskImg, 0, 0, this.gridWidth, this.gridHeight)
      const maskData = ctx.getImageData(0, 0, this.gridWidth, this.gridHeight).data

      const loader = new THREE.TextureLoader()
      loader.load(
        `../images/${config.image}`,
        (texture) => {
          texture.minFilter = THREE.LinearFilter
          texture.magFilter = THREE.LinearFilter
          texture.wrapS = THREE.ClampToEdgeWrapping
          texture.wrapT = THREE.ClampToEdgeWrapping
          this._createGridFromMask(config, texture, maskData)
        },
        undefined,
        () => this._createGridFromMask(config, null, maskData)
      )
    }
    maskImg.src = `../images/${config.mask}`
  }

  _createGridFromMask(config, texture, maskData) {
    const group = new THREE.Group()

    const baseMat = texture
      ? new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.7,
        metalness: 0.2,
      })
      : new THREE.MeshStandardMaterial({ color: 0x888888 })

    const threshold = 240
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const index = ((this.gridHeight - 1 - y) * this.gridWidth + x) * 4
        const r = maskData[index]
        const g = maskData[index + 1]
        const b = maskData[index + 2]
        const brightness = (r + g + b) / 3

        if (brightness > threshold) continue

        const geo = new THREE.BoxGeometry(0.45, 0.45, 0.45)

        // Mosaic-like depth jitter (for style)
        const depthOffset = (Math.random() - 0.5) * 0.6
        const tiltX = (Math.random() - 0.5) * 0.15
        const tiltY = (Math.random() - 0.5) * 0.15

        // Unique material clone to vary lighting slightly
        const mat = baseMat.clone()
        mat.color.offsetHSL(0, 0, (Math.random() - 0.5) * 0.05)

        const uvX = x / this.gridWidth
        const uvY = y / this.gridHeight
        const uvW = 1 / this.gridWidth
        const uvH = 1 / this.gridHeight
        const uvs = geo.attributes.uv.array
        for (let i = 0; i < uvs.length; i += 2) {
          const u = uvs[i]
          const v = uvs[i + 1]
          uvs[i] = uvX + u * uvW
          uvs[i + 1] = uvY + v * uvH
        }
        geo.attributes.uv.needsUpdate = true

        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.x = (x - this.gridWidth / 2) * this.spacing
        mesh.position.y = (y - this.gridHeight / 2) * this.spacing
        mesh.position.z = depthOffset
        mesh.rotation.x = tiltX
        mesh.rotation.y = tiltY

        // Start hidden for animation
        mesh.scale.setScalar(0)
        group.add(mesh)
      }
    }

    group.name = config.id
    this.group.add(group)
    this.grids.push(group)
    if (--this._remainingToCreate === 0) this._initInteractions()
  }

  _initInteractions() {
    this.current = 'codrops'
    this.old = null
    this.is_animating = false
    this.duration = 1

    this.DOM = {
      $btns: document.querySelectorAll('.btns__item button'),
      $canvas: document.querySelector('canvas#sketch')
    }

    this.grids.forEach(g => {
      if (g.name !== this.current) g.children.forEach(m => m.scale.setScalar(0))
    })

    this.DOM.$btns.forEach(btn => {
      console.log("active btn", btn.dataset.id, this.current);
      btn.classList.toggle('active', btn.dataset.id === this.current)
    })

    this._bindEvents()

    //make the default mask visible
    this._revealGrid()

  }

  _bindEvents() {
    this.DOM.$btns.forEach(($btn, i) => {
      $btn.addEventListener('click', () => {
        if (this.is_animating) return
        this.is_animating = true

        this.DOM.$btns.forEach((b, j) => b.classList.toggle('active', i === j))
        this.old = this.current
        this.current = $btn.dataset.id
        if (this.DOM.$canvas) this.DOM.$canvas.dataset.current = this.current

        this._revealGrid()
        this._hideGrid()
      })
    })
  }

  _revealGrid() {
    const grid = this.grids.find(g => g.name === this.current)
    if (!grid) return (this.is_animating = false)
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: this.duration } })
    grid.children.forEach((m, i) => {
      tl.to(m.scale, { x: 1, y: 1, z: 1 }, i * 0.001)
      tl.to(m.position, { z: m.position.z }, '<')
    })
  }

  _hideGrid() {
    const grid = this.grids.find(g => g.name === this.old)
    if (!grid) return (this.is_animating = false)
    const tl = gsap.timeline({
      defaults: { ease: 'power3.inOut', duration: this.duration },
      onComplete: () => (this.is_animating = false)
    })
    grid.children.forEach((m, i) => {
      tl.to(m.scale, { x: 0, y: 0, z: 0 }, i * 0.001)
      tl.to(m.position, { z: 5 }, '<')
    })
  }
}
