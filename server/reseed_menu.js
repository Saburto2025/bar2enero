import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.TURSO_DATABASE_URL || "libsql://bar2deenero-saburto2025.aws-us-east-1.turso.io";
const token = process.env.TURSO_AUTH_TOKEN;

const turso = createClient({
  url: url,
  authToken: token,
});

const menuOficial = [
  { id: '1', nombre: 'Trio de Boquitas', categoria: 'Bocas', precio: 3100, descripcion: 'Frijoles molidos, pico de gallo, carne mechada y patacones', icono: '🧆', imagen_url: '' },
  { id: '2', nombre: 'Torta de Huevo', categoria: 'Bocas', precio: 1500, descripcion: 'Tortilla palmeada con cebolla y cebollino fresco', icono: '🍳', imagen_url: '' },
  { id: '3', nombre: 'Tacos de Carne', categoria: 'Platos Fuertes', precio: 2500, descripcion: 'Servidos con repollo picado y papas fritas tostadas', icono: '🌮', imagen_url: '' },
  { id: '4', nombre: 'Salchichón c/s', categoria: 'Bocas', precio: 2000, descripcion: 'Con repollo fresco y tortilla palmeada artesanal', icono: '🌭', imagen_url: '' },
  { id: '5', nombre: 'Papa Nachos', categoria: 'Bocas', precio: 3900, descripcion: 'Papas fritas con frijoles molidos, carne mechada, lechuga, pico gallo y salsas', icono: '🍟', imagen_url: '' },
  { id: '6', nombre: 'Nachos', categoria: 'Bocas', precio: 3800, descripcion: 'Frijoles molidos, carne mechada, lechuga, pico de gallo y salsa especial', icono: '🧀', imagen_url: '' },
  { id: '7', nombre: 'Costilla', categoria: 'Platos Fuertes', precio: 3800, descripcion: 'Jugosa costilla bañada en salsa barbacoa servida con papas fritas', icono: '🍖', imagen_url: '' },
  { id: '8', nombre: 'Chifrijo', categoria: 'Bocas', precio: 3800, descripcion: 'Frijoles tiernos, arroz blanco, pico de gallo y chicharrón crujiente', icono: '🍲', imagen_url: '' },
  { id: '9', nombre: 'Pezuña', categoria: 'Bocas', precio: 2800, descripcion: 'Servida con arroz caliente y frijoles tiernos sazonados', icono: '🥩', imagen_url: '' },
  { id: '10', nombre: 'Pescado Empanizado', categoria: 'Platos Fuertes', precio: 3800, descripcion: 'Crujiente pescado empanizado con papas y ensalada fresca', icono: '🐟', imagen_url: '' },
  { id: '11', nombre: 'Gallo Morcilla', categoria: 'Bocas', precio: 3000, descripcion: 'Servido sobre 2 tortillas palmeadas calientes', icono: '🫓', imagen_url: '' },
  { id: '12', nombre: 'Carne en Salsa', categoria: 'Platos Fuertes', precio: 4000, descripcion: 'Carne suave en salsa artesanal servida con arroz y tortillas tostadas', icono: '🍲', imagen_url: '' },
  { id: '13', nombre: 'Dedos de Queso', categoria: 'Entradas', precio: 2500, descripcion: 'Crujientes bastones de queso empanizados con dip de la casa', icono: '🧀', imagen_url: '' },
  { id: '14', nombre: 'Rabiol', categoria: 'Platos Fuertes', precio: 2800, descripcion: 'Servido con repollo fresco y papas fritas doradas', icono: '🥟', imagen_url: '' },
  { id: '15', nombre: 'Frijoles Tiernos', categoria: 'Bocas', precio: 2400, descripcion: 'Servidos con arroz blanco y tortilla tostada', icono: '🥣', imagen_url: '' },
  { id: '16', nombre: 'Alitas', categoria: 'Bocas', precio: 4100, descripcion: 'Alitas bañadas en salsa barbacoa servidas con papas fritas', icono: '🍗', imagen_url: '' },
  
  // Bebidas complementarias
  { id: '17', nombre: 'Cerveza Nacional (Imperial / Pilsen)', categoria: 'Cervezas', precio: 1500, descripcion: 'Cerveza nacional bien fría', icono: '🍺', imagen_url: '' },
  { id: '18', nombre: 'Cerveza Importada (Corona / Heineken)', categoria: 'Cervezas', precio: 2200, descripcion: 'Cerveza importada helada con limón', icono: '🍻', imagen_url: '' },
  { id: '19', nombre: 'Michelada', categoria: 'Cervezas', precio: 2500, descripcion: 'Vaso escarchado con sal, limón y cerveza', icono: '🍹', imagen_url: '' },
  { id: '20', nombre: 'Gaseosa / Soda (500ml)', categoria: 'Bebidas', precio: 1200, descripcion: 'Coca-Cola, Fanta, Sprite o Té Frío', icono: '🥤', imagen_url: '' },
  { id: '21', nombre: 'Shot Guaro / Tequila', categoria: 'Cocteles', precio: 1200, descripcion: 'Shot con borde escarchado', icono: '🥃', imagen_url: '' }
];

async function reseed() {
  console.log("🧹 Limpiando tabla 'menu_items' en Turso...");
  await turso.execute("DELETE FROM menu_items");

  console.log("🌱 Insertando los 16 platillos oficiales sin fotografías...");
  for (const item of menuOficial) {
    await turso.execute({
      sql: `INSERT INTO menu_items (id, nombre, categoria, precio, descripcion, icono, imagen_url, disponible)
            VALUES (?, ?, ?, ?, ?, ?, '', 1)`,
      args: [item.id, item.nombre, item.categoria, item.precio, item.descripcion, item.icono]
    });
  }

  const res = await turso.execute("SELECT id, nombre, precio, imagen_url FROM menu_items");
  console.log(`✅ EXITO: Se crearon ${res.rows.length} ítems en el menú sin foto.`);
}

reseed().catch(console.error);
