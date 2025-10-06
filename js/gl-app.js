import * as THREE from 'three'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Models from './Models';

export default class GLApp {
	constructor() {

		window.app = this

		/*----------------------------------------------*/
		//   Renderer                                   */
		/*----------------------------------------------*/
		this.canvas = document.querySelector('canvas#sketch');
		this.pixelRatio = Math.min(window.devicePixelRatio, 2)
		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			alias: true,
			alpha: true
		});
        this.renderer.setClearColor(0x000000, 0)
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(this.pixelRatio)


		/*----------------------------------------------*/
		//   Scene & Camera                             */
		/*----------------------------------------------*/
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
		this.camera.position.z = 6;



		/*----------------------------------------------*/
		//   OrbitControl                              */
		/*----------------------------------------------*/
		this.controls = new OrbitControls(this.camera, this.canvas)
		this.controls.enableDamping = true



		/*----------------------------------------------*/
		//   Load HDR                                   */
		/*----------------------------------------------*/
		this.ambient_light = new THREE.AmbientLight( 0xffffff ); // soft 
		this.scene.add( this.ambient_light );

		this.dir_light = new THREE.DirectionalLight(0xffffff, 10);
		this.dir_light.position.set(5, 5, 5);
		this.scene.add( this.dir_light );

		/*----------------------------------------------*/
		//   Resize                                     */
		/*----------------------------------------------*/
		function onResize() {
			that.camera.aspect = window.innerWidth / window.innerHeight;
			that.camera.updateProjectionMatrix();

			that.pixelRatio = Math.min(window.devicePixelRatio, 2)
			that.renderer.setSize(window.innerWidth, window.innerHeight);
			that.renderer.setPixelRatio(that.pixelRatio)
		}
		window.addEventListener('resize', onResize, false);




		/*----------------------------------------------*/
		//   Models                                     */
		/*----------------------------------------------*/
		this.models = new Models(this)



		/*----------------------------------------------*/
		//   Loop                                       */
		/*----------------------------------------------*/
		let that = this
		function animate() {
			requestAnimationFrame(animate)
			that.renderer.render(that.scene, that.camera)
			that.controls.update()
		}
		animate()	

	}
}


