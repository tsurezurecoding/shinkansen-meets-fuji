// JA-only start enhancement must not leak into the existing translated shells.
export function stripJaTrainWindow(html){return html.replace(/^[\t ]*<!-- JA-TRAIN-WINDOW:START -->[\s\S]*?<!-- JA-TRAIN-WINDOW:END -->\r?\n?/gm,'');}
