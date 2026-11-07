// Lucide icons rendered as inline SVG strings (one stroke weight across the presentation).
import {
  ArrowRight, Bird, CalendarClock, Check, CircleCheck, ClipboardCheck, Clock, CreditCard, Droplets,
  FileText, Gauge, History, House, Inbox, KeyRound, Landmark, LocateFixed, Lock, MapPin, MapPinned,
  Receipt, RotateCcw, Scan, ScrollText, Send, ShieldCheck, Stamp, Tent, Trash2, TreePine, Trees, User,
  UserCheck, Users, UtilityPole, Waves, Wheat, Wind, X,
  Banknote, Bell, BellRing, BatteryFull, Building2, ChevronRight, ClipboardList, Download, Languages, Moon,
  Plane, Signal, Smartphone, Sun, Wallet, Wifi, Layers, TriangleAlert, Paperclip, ChevronDown,
  School, Megaphone, MessageCircle, Camera, Video, PenLine, Upload, Calculator, HeartPulse, ThumbsUp,
  Monitor, Fingerprint, QrCode, Zap,
} from 'lucide';

const SET = {
  arrowRight: ArrowRight, bird: Bird, calendarClock: CalendarClock, check: Check, circleCheck: CircleCheck,
  clipboardCheck: ClipboardCheck, clock: Clock, creditCard: CreditCard, droplets: Droplets, fileText: FileText,
  gauge: Gauge, history: History, house: House, inbox: Inbox, keyRound: KeyRound, landmark: Landmark,
  locateFixed: LocateFixed, lock: Lock, mapPin: MapPin, mapPinned: MapPinned, receipt: Receipt,
  rotateCcw: RotateCcw, scan: Scan, scrollText: ScrollText, send: Send, shieldCheck: ShieldCheck, stamp: Stamp,
  tent: Tent, trash: Trash2, treePine: TreePine, trees: Trees, user: User, userCheck: UserCheck, users: Users,
  utilityPole: UtilityPole, waves: Waves, wheat: Wheat, wind: Wind, x: X,
  banknote: Banknote, bell: Bell, bellRing: BellRing, battery: BatteryFull, building: Building2, chevronRight: ChevronRight,
  clipboardList: ClipboardList, download: Download, languages: Languages, moon: Moon, plane: Plane, signal: Signal,
  smartphone: Smartphone, sun: Sun, wallet: Wallet, wifi: Wifi, layers: Layers, alert: TriangleAlert,
  paperclip: Paperclip, chevronDown: ChevronDown,
  school: School, megaphone: Megaphone, messageCircle: MessageCircle, camera: Camera, video: Video,
  penLine: PenLine, upload: Upload, calculator: Calculator, heartPulse: HeartPulse, thumbsUp: ThumbsUp,
  monitor: Monitor, fingerprint: Fingerprint, qrCode: QrCode, zap: Zap,
};

function inner(name) {
  const node = SET[name];
  if (!node) throw new Error(`Unknown icon: ${name}`);
  return node
    .map(([tag, attrs]) => `<${tag}${Object.entries(attrs).map(([k, v]) => ` ${k}="${v}"`).join('')}/>`)
    .join('');
}

const ATTRS = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

export function icon(name, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" ${ATTRS} aria-hidden="true">${inner(name)}</svg>`;
}

// Icon nested inside a larger SVG drawing, centred on (x, y).
export function svgIcon(name, x, y, size, cls = '') {
  return `<svg class="${cls}" x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" viewBox="0 0 24 24" ${ATTRS}>${inner(name)}</svg>`;
}
