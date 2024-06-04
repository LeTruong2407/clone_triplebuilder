import * as FontData_Bold_Italic from './Open_Sans_Bold_Italic.json';
import * as FontData_Bold from './Open_Sans_Bold.json';
import { MeshPhongMaterial, Mesh, Vector3, Plane, Box3, Group } from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { ScorePopup } from './scorePopup.js';

/**
 * 점수 관리 클래스
 */
export class ScoreManager {

    scene;
    camera;
    control;

    fontData;
    geometries;

    popupFontData;
    popupGeometries;
    sharedPopupMaterial;
    popupObjList;

    scoreTable;
    score;
    scoreUI

    sphere;
    
    highScore;
    highScoreUI

    /**
     * 생성자
     */
    constructor(scene, camera, control, scoreUI, highScoreUI) {
        
        this.scene = scene;
        this.camera = camera;
        this.control = control;
        this.scoreUI = scoreUI;
        this.highScoreUI = highScoreUI;
        this.score = 0;

        // localstorage에 저장되어 있는 하이스코어를 가져옴
        const storageHighScore = localStorage.getItem('highscore');
        if( !storageHighScore ) { // 하이스코어가 없다면 처음실행한것이므로 기본값 설정

            localStorage.setItem('highscore', '0');
            this.highScore = 0;
        } else {
            this.highScore = parseInt(storageHighScore);
        }

        this.highScoreUI.textContent = this.highScore.toString()

        // 점수 테이블, 총 타일레벨은 10이지만 0레벨은 점수가 없으므로 9개만 세팅
        this.scoreTable = [];
        this.scoreTable.push(5);
        this.scoreTable.push(10);
        this.scoreTable.push(20);
        this.scoreTable.push(35);
        this.scoreTable.push(55);
        this.scoreTable.push(80);
        this.scoreTable.push(110);
        this.scoreTable.push(145);
        this.scoreTable.push(200);

        // 폰트 데이터를 로드하고 준비시킨다.
        const fontLoader = new FontLoader();
        this.fontData = fontLoader.parse(FontData_Bold_Italic);
        this.popupFontData = fontLoader.parse(FontData_Bold);

        // 사용할 텍스트 Geometry를 미리 생성해 놓는다.
        // 점수표시용
        
        // 팝업 점수용
        const popupTextList = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'x'];
        this.popupGeometries = {};
        popupTextList.forEach( text => {
            const geometry = new TextGeometry(text, {
                font: this.popupFontData,
                size: 2,
                depth: 1
            });

            // 중점
            geometry.computeBoundingBox();
            const size = new Vector3();
            geometry.boundingBox.getSize(size);
            geometry.translate( size.x * -0.5, size.y * -0.5, size.z * -0.5 );

            // 콤보배율용 'x'는 좀더 작게 처리
            if( text === 'x' ) {
                geometry.scale(0.75, 0.75, 0.75);
            }

            this.popupGeometries[text] = geometry;

        });

        // 팝업 효과 공유 재질
        this.sharedPopupMaterial = new MeshPhongMaterial({
            color: 0x996633,
            specular: 0x050505,
            shininess: 100
        });

        // 팝업 객체 리스트
        this.popupObjList = [];
    }

    /**
     * 점수 관련 초기화
     */
    reset() {

        this.score = 0;
    }

    /**
     * 지정된 숫자로 점수 설정
     * @param score 점수
     */
    setScore(score) {
        
        this.score = score;
        this.scoreUI.textContent = this.score.toString()
    }

    /**
     * 타일레벨로 점수를 추가한다.
     * @param tile 레벨
     * @param comboRatio 콤보배율
     */
    addScore(tile, comboRatio) {

        if( 1 <= tile.level && tile.level <= 9 ) {

            const addScore = this.scoreTable[tile.level-1]
            this.score += (addScore * comboRatio);

            // 팝업 효과 생성
            // 점수를 문자열로 변환하여 geometry 배열을 전달한다.
            const strScore = addScore.toString();
            const geometryArray = [];
            for(let i = 0; i < strScore.length; i++) {
                geometryArray.push(this.popupGeometries[strScore[i]]);
            }

            // 콤보 배율처리
            if( comboRatio > 1.0 ) {
                const strCombo = parseInt(comboRatio.toString()).toString();

                geometryArray.push(this.popupGeometries['x']);
                for(let i = 0; i < strCombo.length; i++) {
                    geometryArray.push(this.popupGeometries[strCombo[i]]);
                }
            }

            // 팝업효과 생성 위치 계산
            const box = new Box3().setFromObject(tile.object);
            const center = new Vector3(), size = new Vector3();
            box.getCenter(center);
            box.getSize(size);

            const spawnLocation = new Vector3();
            spawnLocation.copy(center);
            spawnLocation.y += (size.y * 0.5);

            // 팝업 효과 생성
            const popup = new ScorePopup(this.scene, geometryArray, this.sharedPopupMaterial, spawnLocation);
            this.popupObjList.push(popup);

            // this.updateScoreMesh();
            this.scoreUI.textContent = this.score.toString()
            if( this.score >= this.highScore ) {
                this.highScore = this.score;
                this.saveHighScore();
            }
        }
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
            result.y += 10;
        }

        // 팝업 객체리스트를 역순으로 순회하며 애니메이션이 완료된 객체는 제거한다.
        const popupObjCount = this.popupObjList.length;
        for(let i = popupObjCount-1; i >= 0; i--) {
            if( this.popupObjList[i].isDone ) {
                this.popupObjList[i].dispose();
                this.popupObjList.splice(i, 1);
            }
        }
    }
    
    /**
     * 하이스코어 저장
     */
    saveHighScore() {
        
        localStorage.setItem('highscore', this.highScore.toString());

    }
}