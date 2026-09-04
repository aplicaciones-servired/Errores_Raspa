import { DataTypes, Model } from 'sequelize'
import sequelize from '../db/connection'

export interface RaspaAttributes {
  id?: number
  empresa: string
  nombre: string
  tipoRaspa: string
  imagenFrenteUrl: string
  imagenReversoUrl: string
  imagenErrorUrl: string
  estado: string
  requestId?: string | null
  correoMessageId?: string | null
  respuestaSoporte?: string | null
  createdAt?: Date
  updatedAt?: Date
}

export class Raspa extends Model<RaspaAttributes> {}

Raspa.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    tipoRaspa: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: 'tipo_raspa',
    },
    empresa: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: 'empresa',
    },
    nombre: {
      type: DataTypes.STRING(120),
      allowNull: false,
      field: 'nombre',
    },
    imagenFrenteUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'imagen_frente_url',
    },
    imagenReversoUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'imagen_reverso_url',
    },
    imagenErrorUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'imagen_error_url',
    },
    estado: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'PENDIENTE',
    },
    requestId: {
      type: DataTypes.STRING(60),
      allowNull: true,
      field: 'request_id',
    },
    correoMessageId: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'correo_message_id',
    },
    respuestaSoporte: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'respuesta_soporte',
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    modelName: 'Raspa',
    tableName: 'imagenes_raspa',
    timestamps: true,
  }
)

export default Raspa