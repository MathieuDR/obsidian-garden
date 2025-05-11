import { createIcons } from "lucide"

const loadIcons = () => {
    console.log("loading icons...")
    const smuggler = document.getElementById("smuggled");
    if(!smuggler){
        console.error("no smuggling");
        return;
    }

    const iconMap = JSON.parse(smuggler.dataset.icons ?? "");
    console.log(iconMap)

    createIcons({
        icons: iconMap,
    });
}

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
    loadIcons();
});

loadIcons();