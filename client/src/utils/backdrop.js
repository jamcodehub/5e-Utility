// Props for a popup's dimmed backdrop. The popup closes only when a press both STARTS and ENDS on the backdrop, so
// highlighting text inside the popup and letting go outside it (a drag that ends over the backdrop still fires a click
// there) no longer closes it. The press start is kept on the element itself so it survives a re-render.
export function backdropClose(onClose) {
  return {
    onMouseDown: (e) => { e.currentTarget.dataset.pressed = e.target === e.currentTarget ? '1' : '' },
    onClick: (e) => {
      const startedHere = e.currentTarget.dataset.pressed === '1'
      e.currentTarget.dataset.pressed = ''
      if (startedHere && e.target === e.currentTarget) onClose()
    },
  }
}
