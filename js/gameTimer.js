import { Vector3, MeshPhongMaterial, Group, Mesh, Plane, Color } from "three";
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import * as FontData_Bold_Italic from './Open_Sans_Bold_Italic.json';

/**
 * 게임 시간 표시
 */
export class GameTimer {

    scene;
    camera;
    control;

    fontData;
    gameTime
    remainTime;
    timeCheck;
    gameLogic;
    sphere;
    isPlaying;
    gameOverText;
    timerUI;

    /**
     * 생성자
     */
    constructor(scene, camera, control, gameTime, timerUI) {

        this.scene = scene;
        this.camera = camera;
        this.control = control;
        this.gameTime = gameTime;
        this.remainTime = gameTime;
        this.timerUI = timerUI;
        this.timeCheck = 0;
        this.isPlaying = false;

        // 폰트 데이터
        const fontLoader = new FontLoader();
        this.fontData = fontLoader.parse(FontData_Bold_Italic);

        // 시간표시 가시화 객체 업데이트
        this.timerUI.textContent = this.remainTime.toString()

        this.initGameOverText();
    }

    /**
     * 게임 오버 텍스트 표시
     */
    initGameOverText() {
        const geometry = new TextGeometry('GameOver', {
            font: this.fontData,
            size: 10,
            depth: 2
        });

        // geometry의 바운딩을 계산하여 중점으로 이동
        geometry.computeBoundingBox();
        const size = new Vector3();
        geometry.boundingBox.getSize(size);
        geometry.translate( size.x * -0.5, size.y * -0.5, size.z * -0.5 );

        const material = new MeshPhongMaterial({
            color: 0xff0000,
            specular: 0xff0000,
            shininess: 100
        });

        this.gameOverText = new Mesh(geometry, material);
        this.scene.add(this.gameOverText);
        this.gameOverText.visible = false;
    }

    /**
     * 업데이트
     */
    update(deltaTime) {
        if( this.sphere ) {

            const camForward = new Vector3();
            this.camera.getWorldDirection(camForward);
            const target = this.control.target.clone();
            target.addScaledVector(camForward, this.sphere.radius);

            const plane = new Plane().setFromNormalAndCoplanarPoint(new Vector3(0, 1, 0), this.sphere.center);
            const project = new Vector3();
            plane.projectPoint(target, project);

            const direction = new Vector3().subVectors(project, this.control.target);
            direction.normalize();

            const result = this.control.target.clone();
            result.addScaledVector(direction, this.sphere.radius + 10);
            result.y -= 2.5;

            if( this.isPlaying ) {
                this.timeCheck += deltaTime;
                if( this.timeCheck >= 1.0 ) {
                    this.timeCheck = 0;
    
                    this.remainTime--;
                    if( this.remainTime >= 0 ) {
                        this.timerUI.textContent = this.remainTime.toString()
                    } else {
                        // 게임 오버 처리
                        this.isPlaying = false;
                        this.gameLogic.doGameOver();
                    }
                }
            }

            if( this.gameOverText && this.gameOverText.visible ) {
                this.gameOverText.position.copy(result);
                this.gameOverText.position.y += 25;
                this.gameOverText.lookAt(this.control.target);
            }
        }
    }

    /**
     * 게임로직 인스턴스 설정
     */
    setGameLogic(logic) {
        this.gameLogic = logic;
    }
    
    /**
     * 시간표시 관련 리셋 처리
     */
    reset() {
        this.isPlaying = true;
        this.remainTime = this.gameTime + 1;
        this.timeCheck = 0;
        this.gameOverText.visible = false;
    }
}