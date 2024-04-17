import Game from "../components/game/assets/js/main.tsx";
import styles from "../css/GamePage.module.css";
const GamePage = () => {
  return (
    <div className={styles.main_container}>
      <div className={styles.title_wrap}>World Of Words</div>
      <div className={styles.game_wrap} id="game_container">
        <Game />
      </div>
    </div>
  );
};

export default GamePage;
