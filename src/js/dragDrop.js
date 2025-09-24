// Accessible, robust Drag & Drop utility for the demo UI
// - Uses HTML5 DnD for mouse/desktop
// - Adds touch-pointer fallback
// - Highlights drop zones and moves the actual node (no innerHTML cloning)
export class DragDrop {
    constructor(root = document) {
        this.root = root;
        this.list = this.root.querySelector('.draggable-list');
        this.items = Array.from(this.root.querySelectorAll('.draggable-item'));
        this.dropZones = Array.from(this.root.querySelectorAll('.drop-zone'));
        
        this.draggedElement = null;
        this.cleanupFns = [];
    }

    init() {
        if (!this.list || this.items.length === 0 || this.dropZones.length === 0) return;
        this.enableItemDragging();
        this.enableDropZones();
        this.enableKeyboardSupport();
    }

    enableItemDragging() {
        this.items.forEach((item, idx) => {
            item.setAttribute('draggable', 'true');
            item.setAttribute('role', 'button');
            item.setAttribute('aria-grabbed', 'false');
            item.dataset.index = String(idx);

            const onDragStart = (e) => {
                this.draggedElement = item;
                item.classList.add('dragging');
                item.setAttribute('aria-grabbed', 'true');
                e.dataTransfer?.setData('text/plain', item.dataset.index || '0');
                e.dataTransfer?.setDragImage(this.createGhost(item), 10, 10);
            };

            const onDragEnd = () => {
                item.classList.remove('dragging');
                item.setAttribute('aria-grabbed', 'false');
                this.draggedElement = null;
                this.dropZones.forEach(z => z.classList.remove('over'));
            };

            item.addEventListener('dragstart', onDragStart);
            item.addEventListener('dragend', onDragEnd);
            this.cleanupFns.push(() => {
                item.removeEventListener('dragstart', onDragStart);
                item.removeEventListener('dragend', onDragEnd);
            });

            // Basic touch support: long-press can be added later; simple press-drag
            let touchId = null;
            const onTouchStart = (e) => {
                const t = e.changedTouches[0];
                touchId = t.identifier;
                this.draggedElement = item;
                item.classList.add('dragging');
                this.dropZones.forEach(z => z.classList.add('touch-ready'));
            };
            const onTouchEnd = (e) => {
                const t = Array.from(e.changedTouches).find(x => x.identifier === touchId);
                if (!t) return;
                const target = document.elementFromPoint(t.clientX, t.clientY);
                const zone = target?.closest?.('.drop-zone');
                if (zone && this.draggedElement) {
                    const previousParent = this.draggedElement.parentElement;
                    zone.appendChild(this.draggedElement);
                    zone.classList.add('filled');
                    // If previous parent was a drop zone and is now empty, clear filled state
                    if (previousParent && previousParent.classList?.contains('drop-zone')) {
                        const hasItems = previousParent.querySelector('.draggable-item');
                        if (!hasItems) previousParent.classList.remove('filled');
                    }
                }
                item.classList.remove('dragging');
                this.draggedElement = null;
                this.dropZones.forEach(z => z.classList.remove('touch-ready'));
            };
            item.addEventListener('touchstart', onTouchStart, { passive: true });
            item.addEventListener('touchend', onTouchEnd);
            this.cleanupFns.push(() => {
                item.removeEventListener('touchstart', onTouchStart);
                item.removeEventListener('touchend', onTouchEnd);
            });
        });
    }

    enableDropZones() {
        this.dropZones.forEach(zone => {
            const onDragOver = (e) => {
                e.preventDefault();
                try { if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'; } catch (_) {}
                zone.classList.add('over');
                // While hovering a drop zone, move the actual element here
                // so it no longer occupies its original position.
                if (this.draggedElement && this.draggedElement.parentElement !== zone) {
                    zone.appendChild(this.draggedElement);
                }
            };
            const onDragEnter = () => zone.classList.add('over');
            const onDragLeave = (e) => {
                const related = e.relatedTarget;
                if (!related || !zone.contains(related)) zone.classList.remove('over');
            };
            const onDrop = (e) => {
                e.preventDefault();
                zone.classList.remove('over');
                if (this.draggedElement) {
                    const previousParent = this.draggedElement.parentElement;
                    zone.appendChild(this.draggedElement);
                    zone.classList.add('filled');
                    // If previous parent was a drop zone and is now empty, clear filled state
                    if (previousParent && previousParent.classList?.contains('drop-zone')) {
                        const hasItems = previousParent.querySelector('.draggable-item');
                        if (!hasItems) previousParent.classList.remove('filled');
                    }
                }
            };

            // Attach listeners on the zone itself
            zone.addEventListener('dragover', onDragOver);
            zone.addEventListener('dragenter', onDragEnter);
            zone.addEventListener('dragleave', onDragLeave);
            zone.addEventListener('drop', onDrop);

            // Also attach to the inner label so dropping on the text works everywhere
            const label = zone.querySelector('.drop-zone-label');
            if (label) {
                label.addEventListener('dragover', onDragOver);
                label.addEventListener('dragenter', onDragEnter);
                label.addEventListener('dragleave', onDragLeave);
                label.addEventListener('drop', onDrop);
            }

            this.cleanupFns.push(() => {
                zone.removeEventListener('dragover', onDragOver);
                zone.removeEventListener('dragenter', onDragEnter);
                zone.removeEventListener('dragleave', onDragLeave);
                zone.removeEventListener('drop', onDrop);
                if (label) {
                    label.removeEventListener('dragover', onDragOver);
                    label.removeEventListener('dragenter', onDragEnter);
                    label.removeEventListener('dragleave', onDragLeave);
                    label.removeEventListener('drop', onDrop);
                }
            });
        });
    }

    enableKeyboardSupport() {
        // Space/Enter to pick up, ArrowLeft/Right to move between zones, Escape to cancel
        this.items.forEach(item => {
            const onKeyDown = (e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    if (this.draggedElement === item) {
                        item.classList.remove('dragging');
                        this.draggedElement = null;
                    } else {
                        this.draggedElement = item;
                        item.classList.add('dragging');
                    }
                }
                if (!this.draggedElement) return;
                const zones = this.dropZones;
                const currentZone = item.parentElement?.closest?.('.drop-zone');
                let idx = zones.indexOf(currentZone);
                if (e.key === 'ArrowLeft') {
                    idx = Math.max(0, idx - 1);
                    zones[idx]?.appendChild(item);
                } else if (e.key === 'ArrowRight') {
                    idx = Math.min(zones.length - 1, idx + 1);
                    zones[idx]?.appendChild(item);
                } else if (e.key === 'Escape') {
                    item.classList.remove('dragging');
                    this.draggedElement = null;
                }
            };
            item.addEventListener('keydown', onKeyDown);
            this.cleanupFns.push(() => item.removeEventListener('keydown', onKeyDown));
        });
    }

    createGhost(source) {
        const ghost = source.cloneNode(true);
        ghost.style.position = 'absolute';
        ghost.style.top = '-9999px';
        ghost.style.left = '-9999px';
        document.body.appendChild(ghost);
        setTimeout(() => document.body.removeChild(ghost), 0);
        return ghost;
    }

    destroy() {
        this.cleanupFns.forEach(fn => fn());
        this.cleanupFns = [];
    }
}
