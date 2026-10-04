import "./style.css";
import { Game } from "./game/core/Game";

async function main(): Promise<void> {
    const game = new Game();

    await game.init();
}

main();