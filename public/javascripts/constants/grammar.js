export const PLANT = 'P'
export const INTERNODE = 'I'
export const SEGMENT = 'S'
export const LEAF = 'L'
export const FLOWER = 'W'
export const PEDICEL = 'C'
export const WEDGE = 'D'

export const FORWARD = 'F'
export const FORWARD_NO_LINE = 'f'
export const TURN_LEFT = '+'
export const TURN_RIGHT = '-'
export const PITCH_UP = '^'
export const PITCH_DOWN = '&'
export const ROLL_LEFT = '<'
export const ROLL_RIGHT = '>'
export const TURN_AROUND = '|'
export const NEXT_COLOR = '#'
export const START_POLYGON = '{'
export const END_POLYGON = '}'
export const START_BRANCH = '['
export const END_BRANCH = ']'

export const RULES = {
  [PLANT]: `${INTERNODE}+[${PLANT}+${FLOWER}]--<[--${LEAF}]${INTERNODE}[++${LEAF}]-[${PLANT}${FLOWER}]++${PLANT}${FLOWER}`,
  [INTERNODE]: `F${SEGMENT}[>&&${LEAF}][<^^${LEAF}]F${SEGMENT}`,
  [SEGMENT]: `${SEGMENT}F${SEGMENT}`,
  [LEAF]: '[#{+f-ff-f+|+f-ff-f}]',
  [FLOWER]: `[${PEDICEL}##<${WEDGE}<<<<${WEDGE}<<<<${WEDGE}<<<<${WEDGE}<<<<${WEDGE}]`,
  [PEDICEL]: 'FF',
  [WEDGE]: '[#^F][{^^^^-f+f|-f+f}]'
}
