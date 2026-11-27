/* Clasificación de repuestos por rubro y detección de equipo compatible */
var CATS = [
 {k:'generador', n:'Generador', re:/\bD\d{4,5}i|rato|carbur|crank|camshaft|piston|cylinder|spark|muffler|exhaust|ignition|gasoline|inverter|magneto|\(ZS\)|fuel|\boil\b|rocker|valve seat|engine/i,
  t:'Repuesto del generador inverter DJI (líneas D6000i, D8000iE, D12000i/iE/iEP, D14000iE), usado para cargar las baterías inteligentes de los Agras en el campo. Ante fallas de arranque, consumo excesivo o pérdida de potencia conviene revisar filtros, bujía, combustible y aceite antes de cambiar piezas mayores.'},
 {k:'mezclador', n:'Mezclador', re:/mezclador|\bmix\b|tekron|sellos mec|espiga|dreno|curva/i,
  t:'Equipo o repuesto para la preparación del caldo de pulverización (mezcladores JR Mix y sus conexiones). Lavar con agua limpia después de cada uso para evitar que los productos dañen sellos y conexiones.'},
 {k:'helice', n:'Hélices', re:/propel|h[eé]lice|blade/i,
  t:'Pieza del sistema de hélices. Las hélices CW (horario) y CCW (antihorario) no son intercambiables: respetar el sentido marcado en cada brazo. Reemplazar ante fisuras, golpes o desbalance; un aspa dañada genera vibración y afecta los motores.'},
 {k:'tornilleria', n:'Tornillería', re:/^\s*(screw|nut|bolt|washer|circlip|stud|m\d\s)|\b(screw|nut|locknut|bolt|washer|circlip|stud)\b|^\s*[MT]\d{2}-[A-Z]{2}/i,
  t:'Tornillería y fijaciones. El código indica rosca y largo (ej. M30 = M3, M40 = M4). Muchos tornillos DJI llevan traba química de fábrica; al reinstalar aplicar fijador de rosca y respetar el torque para no dañar insertos.'},
 {k:'cables', n:'Cables y conectores', re:/cable|connector|\bplug\b|wire|harness|alimentaci/i,
  t:'Cable o conector del sistema eléctrico o de señal. Revisar pines doblados, sulfatación o aislación cortada. Desconectar siempre la batería antes de manipular cables y verificar que el conector quede bien trabado y sellado.'},
 {k:'bateria', n:'Baterías y carga', re:/batter|charg|cargador|power supply/i,
  t:'Parte del sistema de baterías inteligentes o carga. Mantener los contactos limpios y secos; no cargar baterías calientes recién usadas y almacenarlas a carga media si no se usan por varios días.'},
 {k:'control', n:'Radiocontrol', re:/remote|\bRC\b|rc plus|RM7\d\d|RC7\d\d|control stick|\bdial\b|button|thumb|dongle|screen|lanyard|control remoto|sticks|scroll wheel/i, code:/^BC\.(RC|EN)/,
  t:'Repuesto del radiocontrol (DJI RC Plus / RM700 y similares). Incluye placas, sticks, botones, carcasas y módulos de comunicación. Tras el cambio, calibrar sticks y volver a vincular el control con la aeronave si corresponde.'},
 {k:'sensores', n:'Radar y sensores', re:/radar|sensor|vision|camera|fpv|laser|binocular|thermal|barometer|gauge|meter|weighing|spotlight|lidar|optical/i,
  t:'Sensor o componente de percepción (radar, visión, FPV, pesaje o nivel). Limpiar lentes y ventanas con paño suave; tras reemplazarlo, calibrar desde la app DJI Agras y comprobar que no aparezcan alertas antes de volar.'},
 {k:'esparcidor', n:'Esparcidor', re:/spread|auger|spinner|feeder|granul|hopper/i,
  t:'Repuesto del sistema de esparcido de sólidos (semillas, fertilizantes). Limpiar restos de producto luego de cada jornada: la humedad del fertilizante corroe sinfín, discos y motores.'},
 {k:'estructuraA', n:'Estructura', re:/landing gear|carbon tube|crossbeam|frame(?! damping)/i, alias:'estructura'},
 {k:'pulverizacion', n:'Pulverización', re:/spray|sprinkler|nozzle|pump|impeller|centrifugal|hose|valve|lance|tank|flow|liquid|atomiz|mist|\btee\b|pipe|tube|filter|drain|inlet|outlet|y-tee|vent|bomba|filtro|registro|nipel|agitator|elbow/i,
  t:'Componente del sistema de pulverización (tanque, bombas, mangueras, picos o atomizadores). Enjuagar con agua limpia al terminar, revisar filtros y o-rings, y verificar que no haya pérdidas antes de cargar producto.'},
 {k:'motor', n:'Motores y ESC', re:/motor|\besc\b|stator|rotor|propulsion|servo/i,
  t:'Parte del sistema de propulsión (motores y variadores ESC). Ante ruidos, calentamiento o alertas de motor en la app, revisar rodamientos, hélices y conectores. Proteger del agua y del polvo de productos.'},
 {k:'electronica', n:'Electrónica', re:/board|module|pcba|fpcba|\bsdr\b|rtk|gps|antenna|signal|electronic|\bfan\b|switch|usb|relay|chip|core/i,
  t:'Placa o módulo electrónico (control de vuelo, comunicación, RTK, GPS o distribución de energía). Manipular con cuidado de la estática y actualizar el firmware desde la app después de reemplazarlo.'},
 {k:'juntas', n:'Juntas y gomas', re:/rubber|ring|seal|gasket|\bpad\b|foam|damping|teflon|silicone|grommet/i,
  t:'Junta, sello, goma o amortiguador. Son piezas de desgaste que garantizan estanqueidad y absorben vibraciones: conviene tener stock y cambiarlas cuando están endurecidas, deformadas o agrietadas.'},
 {k:'estructura', n:'Estructura', re:/\barm\b|frame|landing|bracket|crossbeam|shell|cover|base|plate|clamp|buckle|lock|shaft|rod|handle|piece|beam|hood|panel|holder|support|guide|rail|spring|hook|cap|stopper|clip|sleeve|axis|hinge|corner/i,
  t:'Pieza estructural (brazos, tren de aterrizaje, carcasas, soportes y trabas). Revisar fisuras y juego en las trabas de los brazos; un brazo mal trabado puede causar vibraciones o pérdida de control.'},
 {k:'herramientas', n:'Herramientas y kits', re:/wrench|tool|sticker|kit|\bkey\b|llave|decal/i,
  t:'Herramienta, kit o accesorio para mantenimiento y armado del equipo.'},
 {k:'otros', n:'Otros', re:/./,
  t:'Repuesto original de la línea DJI Agras. Confirmar con el código que corresponda al modelo de su equipo antes de pedirlo.'}
];
var CAT_BY = {}; CATS.forEach(function(c){ if(!c.alias) CAT_BY[c.k]=c; });
function catOf(d, code){
  for (var i=0;i<CATS.length;i++){ var c=CATS[i];
    if ((c.re && c.re.test(d)) || (c.code && c.code.test(code||''))) return c.alias || c.k; }
  return 'otros';
}
function modelsOf(d){
  var out=[], m, re=/\bT(10|16|20P?|25P?|30|40|50|60|70P?|100)\b/gi;
  while((m=re.exec(d))) { var v='T'+m[1].toUpperCase(); if(out.indexOf(v)<0) out.push(v); }
  var g=d.match(/\bD\d{4,5}i[A-Z]*/i); if(g) out.push(g[0].replace(/i(.*)$/i, function(_,s){return 'i'+s.toUpperCase();}));
  if(/mavic/i.test(d)) out.push('Mavic 3');
  if(/rc plus/i.test(d)) out.push('RC Plus');
  return out;
}
if (typeof module!=='undefined') module.exports={CATS:CATS,catOf:catOf,modelsOf:modelsOf};
