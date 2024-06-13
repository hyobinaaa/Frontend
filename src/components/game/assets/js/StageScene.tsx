import Phaser from "phaser";
import background from "../img/forest2.png";
import stageMenuImg from "../img/stageMenu.png";
import descriptionImg from "../img/description.png";
import foggyDescImg from "../img/foggyDesc.png";
import instance from "../../../../api/axios";

interface Note {
  id: number;
  user_id: number;
  level_id: number;
  title: string;
  gana: string; // 실제 구조에 맞게 타입을 조정해주세요.
  // 추가 필드...
}

export default class StageScene extends Phaser.Scene {
  notes: Note[];
  selectedNote: Note | null; // 선택된 노트를 저장할 변수

  constructor() {
    super("stage-scene");
    this.notes = [];
    this.selectedNote = null; // 초기에는 선택된 노트가 없음
  }

  preload() {
    this.load.image("forest", background);
    this.load.image("stageMenu", stageMenuImg);
    this.load.image("description", descriptionImg);
    this.load.image("foggyDescImg", foggyDescImg);
  }

  create() {
    this.cameras.main.fadeIn(1000, 0, 0, 0);
    //화면 중앙
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // 화면 크기에 맞추어 이미지 스케일 조정
    const image = this.add.image(0, 0, "forest");
    image.setOrigin(0, 0);
    image.setScale(1);

    // 단어장 데이터 받아오기
    instance
      .get("/api/vocabularyNote")
      .then((response) => {
        // 데이터 불러오기 성공
        console.log("데이터:", response.data);

        this.notes = response.data.notes.map(
          (note: { gana: string; meaning: string; kanji: string }) => ({
            ...note,
            gana: JSON.parse(note.gana),
            meaning: note.meaning ? JSON.parse(note.meaning) : null,
            kanji: note.kanji ? JSON.parse(note.kanji) : null,
          })
        );
        console.log("파싱된 데이터:", this.notes);
      })
      .catch((error) => {
        // 데이터 불러오기 실패
        console.error("데이터 불러오기 오류:", error);
      });

    // 단어 선택 팝업 초기화 (기본적으로는 숨김 상태)
    const wordSelectPopup = this.add
      .container(centerX, centerY)
      .setVisible(false);
    const popupBackground = this.add
      .graphics()
      .fillStyle(0xffffff, 0.8)
      .fillRoundedRect(-150, -200, 300, 400, 20);
    wordSelectPopup.add(popupBackground);

    // 단어 목록 표시
    const wordTextStyle = { font: "18px Arial", fill: "#000" };
    const yOffset = -180; // 첫 번째 단어의 y 위치

    // 단어 선택 로직 (가상 코드)
    const selectWord = (word: string) => {
      console.log("Selected word:", word);
      // 여기에 단어 선택 시 필요한 로직 추가
    };

    // 단어 목록을 동적으로 생성
    this.notes.forEach((note, index) => {
      const wordText = this.add
        .text(-140, yOffset + index * 40, note.title, wordTextStyle)
        .setInteractive();
      wordText.on("pointerdown", () => selectWord(note.title));
      wordSelectPopup.add(wordText);
    });

    // 스테이지 메뉴
    const stageMenu = this.add
      .image(centerX, centerY, "stageMenu")
      .setScale(0.7);
    stageMenu.setOrigin(1.5, 0.6);

    const description = this.add.image(centerX, centerY, "description");
    description.setOrigin(0.24, 0.6);

    const stageWidth = 240; // 스테이지 선택 칸의 너비
    const stageHeight = 45; // 스테이지 선택 칸의 높이
    const stages = [
      { x: centerX - 260, y: centerY - 250 },
      { x: centerX - 260, y: centerY - 190 },
      { x: centerX - 260, y: centerY - 130 },
    ];

    const descImg = this.add
      .image(centerX + 140, centerY - 130, "foggyDescImg")
      .setVisible(false);
    // 스테이지 선택 칸에 대한 시각적 피드백 (예: 색상 변경)

    const descText = this.add
      .text(centerX, centerY, "", {
        fontFamily: "PFStardust", // CSS에서 로드한 폰트 이름을 여기에 적용
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.3, 0.1)

      .setVisible(false);

    stages.forEach((stage, index) => {
      // 투명한 사각형으로 가상의 버튼 생성
      const button = this.add
        .rectangle(stage.x, stage.y, stageWidth, stageHeight, 0x0000ff, 0)
        .setInteractive();

      // 마우스 오버 시
      button.on("pointerover", () => {
        button.setFillStyle(0xffffff, 0.5); // 투명도 50%의 흰색으로 변경

        if (index === 0) {
          descImg.setVisible(true);
          descText.setText(
            "안개낀 숲으로 자유롭게 연습할 수 있는 공간입니다. \n\n문제를 틀려도 HP가 감소하지 않습니다. \n\n자유롭게 연습해보세요!"
          );
          descText.setVisible(true);
        } else if (index === 1) {
          descText.setVisible(true);
          descText.setText(
            "서식지를 찾아가 고블린을 사냥하세요. \n\n고블린은 랜덤하게 등장할 것입니다."
          );
        }
      });

      // 마우스 아웃 시
      button.on("pointerout", () => {
        // 원래 상태로 복귀
        button.setFillStyle(0x0000ff, 0); // 다시 투명하게
        descImg.setVisible(false);
        descText.setVisible(false);
      });

      // 클릭 시
      button.on("pointerdown", () => {
        console.log(`스테이지 ${index + 1} 선택됨`);
        // 해당 스테이지 로딩 로직
        if (index === 0) {
          //모달
          this.showWordSelectionModal();
        }
      });
    });

    // 플레이어와 땅 사이의 충돌 처리
  }

  showWordSelectionModal() {
    // 모달 배경
    const modalBackground = this.add
      .graphics({ fillStyle: { color: 0x000000, alpha: 0.5 } })
      .setInteractive(
        new Phaser.Geom.Rectangle(
          0,
          0,
          this.cameras.main.width,
          this.cameras.main.height
        ),
        Phaser.Geom.Rectangle.Contains
      );
    modalBackground.fillRect(
      0,
      0,
      this.cameras.main.width,
      this.cameras.main.height
    );

    modalBackground.on("pointerdown", () => {
      // 모달 배경을 클릭해도 아무 일도 일어나지 않음
    });

    // 모달 본체
    const modalWidth = 400;
    const modalHeight = 300;
    const modalX = (this.cameras.main.width - modalWidth) / 2;
    const modalY = (this.cameras.main.height - modalHeight) / 2;
    const modal = this.add.graphics({ fillStyle: { color: 0x222222 } });
    modal.fillRect(modalX, modalY, modalWidth, modalHeight);

    // 단어장 목록 표시
    const textOffsetX = modalX + 20;
    const textOffsetY = modalY + 20;
    const textStepY = 30;
    let currentY = textOffsetY;
    this.notes.forEach((note) => {
      const wordText = this.add
        .text(textOffsetX, currentY, note.title, {
          font: "16px Arial",
          color: "#FFFFFF",
        })
        .setInteractive();
      wordText.on("pointerdown", () => {
        this.selectedNote = note;
        modalBackground.destroy();
        modal.destroy();
        wordText.destroy();

        // 선택된 단어장을 가지고 씬 전환
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.sound.stopByKey("mainBgm");
          // 선택한 단어장 정보를 전달하며 씬 시작
          this.scene.start("foggy-scene", { selectedNote: this.selectedNote });
        });
      });
      currentY += textStepY;
    });
  }
  update() {}
}
