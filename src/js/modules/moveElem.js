export default function moveElem(block, newPlace, media, method) {
    const mediaQuery = window.matchMedia(media);
    const oldPlace = {
        parentElem: block.parentElement,
        nextElem: block.nextElementSibling,
        prevElem: block.previousElementSibling,
    };
    Element.prototype.hasDirectChild = function (child) {
        return Array.from(this.children).includes(child);
    };
    function moveWith(method) {
        switch (method) {
            case "append":
                newPlace.append(block);
                break;
            case "prepend":
                newPlace.prepend(block);
                break;
            case "before":
                newPlace.before(block);
                break;
            case "after":
                newPlace.after(block);
                break;
        }
    }
    function change() {
        if (mediaQuery.matches && !newPlace.hasDirectChild(block)) {
            moveWith(method);
            // eval(`newPlace.${method}(block)`);
        } else if (
            !mediaQuery.matches &&
            !oldPlace.parentElem.hasDirectChild(block)
        ) {
            let pos =
                oldPlace.nextElem !== null
                    ? "before"
                    : oldPlace.prevElem !== null
                    ? "after"
                    : "inside";
            switch (pos) {
                case "before":
                    oldPlace.nextElem.before(block);
                    break;
                case "after":
                    oldPlace.prevElem.after(block);
                    break;
                case "inside":
                    oldPlace.parentElem.append(block);
                    break;
            }
        }
    }
    mediaQuery.addListener(change);
    change();
}
// const block = document.querySelector(".block");
// const newPlace = document.querySelector(".mobile");

// moveElem(block, newPlace, "(max-width: 768px)", "append");
