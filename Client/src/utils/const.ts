export const API_URL = import.meta.env.VITE_DATA_URL

export const API_LOGIN = import.meta.env.VITE_DATA_LOGIN

export const EMPRESAS = ['Servired', 'Multired'] as const

export type Empresa = (typeof EMPRESAS)[number]

export const TIPO_RASPAS = [
  'CHERRY TWIST',
  'GALLINA MILLONARIA',
  '777',
  'SUERTE 7',
  'CHANCHITO',
  'GANA FACIL',
  'ORO Y PLATA',
  'RASPA 5 ANOS ANIVERSARIO',
  'DIAMANTES',
  'TURBOPREMIOS',
  '2 EN 1',
  'DINERO LOCO',
  'FIEBRE DE GOL',
  'BILLULLO',
  'ESMERALDAS',
  'COOL 7S',
  'EL JUEGO DEL SAPO',
  '8S LOCOS',
  'CARNAVVALES DE COLOMBIA',S
  'NAVIDAD DORADA',
] as const

export type TipoRaspa = (typeof TIPO_RASPAS)[number]
