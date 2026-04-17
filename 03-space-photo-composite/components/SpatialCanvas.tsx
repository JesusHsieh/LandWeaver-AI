
import React, { useState, useRef, useEffect } from 'react';
import { Camera, User, Trees, Move, XCircle, Plus, RotateCw, Info, Sprout, Edit2, Mountain, Lightbulb, Droplets, Flower, Armchair } from 'lucide-react';
import { SceneObject, CameraState, ObjectType, ObjectAttributes } from '../types';

interface SpatialCanvasProps {
  objects: SceneObject[];
  setObjects: (objs: SceneObject[]) => void;
  camera: CameraState;
  setCamera: (cam: CameraState) => void;
}

// Translation mapping for display
const OBJECT_TRANSLATIONS: Record<ObjectType, string> = {
  [ObjectType.Man]: '男人',
  [ObjectType.Woman]: '女人',
  // Child removed
  [ObjectType.TreeBroadleaf]: '闊葉溫帶喬木',
  [ObjectType.TreeConifer]: '松柏科樹',
  [ObjectType.TreePalm]: '棕櫚樹',
  [ObjectType.ShrubSmall]: '矮灌木',
  [ObjectType.ShrubMedium]: '中灌木',
  [ObjectType.ShrubLarge]: '大灌木',
  [ObjectType.ShrubGroundCover]: '地被植物',
  [ObjectType.FurnitureChair]: '椅子',
  [ObjectType.FurnitureTable]: '桌子',
  // New Landscape Objects
  [ObjectType.LandscapeRock]: '景觀石',
  [ObjectType.LandscapeLight]: '景觀燈',
  [ObjectType.WaterFeature]: '水景/水缽',
  [ObjectType.OutdoorPot]: '景觀盆栽',
};

// Attribute Configurations
const ATTRIBUTE_CONFIG: Record<string, { label: string; options: string[] }[]> = {
  // Humans
  'Human': [
    { label: '年齡', options: ['兒童', '青少年', '20-30歲', '30-50歲', '50-70歲', '70歲以上'] },
    { label: '膚色', options: ['白皙', '自然', '小麥色', '深色'] },
    { label: '髮色', options: ['黑髮', '棕髮', '金髮', '紅髮', '灰白髮'] },
    { label: '穿著', options: ['休閒', '正式西裝', '運動風', '時尚', '極簡'] },
    { label: '動作', options: ['站立', '行走', '坐著', '看書/手機', '交談'] },
  ],
  // Broadleaf Trees (闊葉溫帶喬木)
  'TreeBroadleaf': [
    { label: '樹種', options: ['榕樹', '台灣欒樹', '樟樹', '楓香', '橡樹', '櫻花樹', '小葉欖仁', '鳳凰木'] },
    { label: '高度', options: ['幼苗 (1-2m)', '小型 (3-5m)', '中型 (6-10m)', '大型 (10m+)'] },
    { label: '季節狀態', options: ['翠綠茂盛', '秋季變色', '枯枝(冬季)', '開花'] },
  ],
  // Conifer Trees (松柏科樹)
  'TreeConifer': [
    { label: '樹種', options: ['松樹', '柏樹', '落羽松', '龍柏', '南洋杉'] },
    { label: '高度', options: ['幼苗 (1-2m)', '小型 (3-5m)', '中型 (6-10m)', '大型 (10m+)'] },
    { label: '季節狀態', options: ['常綠', '部分枯黃'] },
  ],
  // Palm Trees (棕櫚樹)
  'TreePalm': [
    { label: '樹種', options: ['大王椰子', '檳榔樹', '蒲葵', '華盛頓椰子', '海棗'] },
    { label: '高度', options: ['小型 (2-4m)', '中型 (5-8m)', '大型 (9-15m)'] },
    { label: '型態', options: ['單幹直立', '叢生'] },
  ],
  // Small Shrubs (矮灌木)
  'ShrubSmall': [
    { label: '樹種', options: ['馬櫻丹', '雪茄花', '六月雪', '繁星花', '長壽花', '杜鵑(小型)'] },
    { label: '花色', options: ['混色', '紅色', '黃色', '紫色', '白色', '無花(純葉)'] },
    { label: '修剪', options: ['自然生長', '修剪成球型'] },
  ],
  // Medium Shrubs (中灌木)
  'ShrubMedium': [
    { label: '樹種', options: ['桂花', '仙丹花', '朱槿(扶桑花)', '樹蘭', '金露花', '梔子花'] },
    { label: '狀態', options: ['開花中', '綠葉茂密'] },
    { label: '形狀', options: ['自然擴散', '綠籬(方形)', '圓形'] },
  ],
  // Large Shrubs (大灌木)
  'ShrubLarge': [
    { label: '樹種', options: ['七里香', '變葉木', '夾竹桃', '黃鐘花', '鵝掌藤', '南天竹'] },
    { label: '高度', options: ['1.5m', '2m', '2.5m+'] },
    { label: '型態', options: ['叢生', '修剪成牆', '獨立單株'] },
  ],
  // Ground Cover (地被)
  'ShrubGroundCover': [
    { label: '種類', options: ['血鄂草', '蔓花生', '越橘葉蔓榕', '沿階草(玉龍草)', '蟛蜞菊', '腎蕨'] },
    { label: '覆蓋密度', options: ['完全覆蓋(密)', '稀疏點綴', '沿邊緣種植'] },
    { label: '質感', options: ['草皮狀', '葉片層次豐富', '開花點綴'] },
  ],
  // Furniture
  'Furniture': [
    { label: '材質', options: ['戶外柚木', '鋁合金', '編織藤', '塑料', '鑄鐵'] },
    { label: '顏色', options: ['黑色', '白色', '原木色', '深灰色', '鮮豔色'] },
  ],
  // Landscape Rocks (景觀石)
  'LandscapeRock': [
    { label: '材質', options: ['天然河石', '花崗岩', '黑奇石', '咕咾石', '人造石'] },
    { label: '形狀', options: ['圓潤', '自然崎嶇', '層疊狀', '直立(孤石)'] },
    { label: '大小', options: ['小型 (30cm)', '中型 (50-80cm)', '大型 (1m+)', '巨石 (1.5m+)'] }
  ],
  // Landscape Lights (景觀燈)
  'LandscapeLight': [
    { label: '類型', options: ['矮草皮燈', '高景觀燈', '投射燈(照樹)', '地面埋燈', '燈串', '日式石燈籠'] },
    { label: '光色', options: ['暖黃光(3000K)', '自然光(4000K)', '冷白光(6000K)', '彩色光'] },
    { label: '狀態', options: ['開啟', '關閉'] }
  ],
  // Water Feature (水景)
  'WaterFeature': [
     { label: '種類', options: ['石缽水盆', '日式流水組', '現代極簡水池', '歐式小噴泉', '生態鳥浴盆'] },
     { label: '材質', options: ['石材', '水泥/清水模', '陶瓷', '金屬(耐候鋼)'] },
     { label: '水態', options: ['靜止如鏡', '流動/湧泉', '滴落'] }
  ],
  // Outdoor Pot (盆栽)
  'OutdoorPot': [
    { label: '盆器材質', options: ['陶瓦(Terracotta)', '水泥灰', '釉燒陶', '編織籃', '金屬'] },
    { label: '盆器形狀', options: ['圓形', '方形', '高筒型', '碗型'] },
    { label: '植栽類型', options: ['觀葉植物', '多肉組合', '草花', '小型樹木'] }
  ]
};

const getCategory = (type: ObjectType): string => {
  if ([ObjectType.Man, ObjectType.Woman].includes(type)) return 'Human';
  if (type === ObjectType.TreeBroadleaf) return 'TreeBroadleaf';
  if (type === ObjectType.TreeConifer) return 'TreeConifer';
  if (type === ObjectType.TreePalm) return 'TreePalm';
  
  if (type === ObjectType.ShrubSmall) return 'ShrubSmall';
  if (type === ObjectType.ShrubMedium) return 'ShrubMedium';
  if (type === ObjectType.ShrubLarge) return 'ShrubLarge';
  if (type === ObjectType.ShrubGroundCover) return 'ShrubGroundCover';
  
  if ([ObjectType.FurnitureChair, ObjectType.FurnitureTable].includes(type)) return 'Furniture';
  
  // New Categories (Direct mapping)
  if (type === ObjectType.LandscapeRock) return 'LandscapeRock';
  if (type === ObjectType.LandscapeLight) return 'LandscapeLight';
  if (type === ObjectType.WaterFeature) return 'WaterFeature';
  if (type === ObjectType.OutdoorPot) return 'OutdoorPot';

  return '';
};

// Helper for rendering icons
const getObjectIcon = (type: ObjectType) => {
  if ([ObjectType.Man, ObjectType.Woman].includes(type)) return <User size={16} />;
  
  if (type === ObjectType.ShrubGroundCover) return <Sprout size={16} />;
  if (type.includes('Tree') || type.includes('Shrub')) return <Trees size={16} />;
  
  if (type === ObjectType.LandscapeRock) return <Mountain size={14} />;
  if (type === ObjectType.LandscapeLight) return <Lightbulb size={14} />;
  if (type === ObjectType.WaterFeature) return <Droplets size={14} />;
  if (type === ObjectType.OutdoorPot) return <Flower size={14} />;
  
  if (type.includes('Furniture')) return <Armchair size={14} />;

  return <User size={16} />;
};

// Helper for rendering colors
const getObjectColorClass = (type: ObjectType) => {
    if (type === ObjectType.LandscapeRock) return 'bg-stone-500 border-stone-300';
    if (type === ObjectType.LandscapeLight) return 'bg-amber-400 border-amber-200';
    if (type === ObjectType.WaterFeature) return 'bg-cyan-500 border-cyan-200';
    if (type === ObjectType.OutdoorPot) return 'bg-orange-700 border-orange-400';
    
    if (type.includes('Tree')) return 'bg-emerald-700 border-emerald-400';
    if (type.includes('Shrub')) return 'bg-green-600 border-green-300';
    if (type === ObjectType.ShrubGroundCover) return 'bg-green-500 border-green-200';
    
    if ([ObjectType.Man, ObjectType.Woman].includes(type)) return 'bg-blue-600 border-blue-300';
    
    return 'bg-slate-600 border-slate-400'; // Furniture default
};

const SpatialCanvas: React.FC<SpatialCanvasProps> = ({ objects, setObjects, camera, setCamera }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | 'camera' | null>(null);
  const [interactionMode, setInteractionMode] = useState<'none' | 'move' | 'rotate'>('none');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [selectedObjectType, setSelectedObjectType] = useState<ObjectType>(ObjectType.Man);
  const [currentAttributes, setCurrentAttributes] = useState<ObjectAttributes>({});

  // Reset attributes when type changes - helper to get defaults
  const getDefaultAttributes = (type: ObjectType) => {
    const category = getCategory(type);
    const defaults: ObjectAttributes = {};
    const config = ATTRIBUTE_CONFIG[category] || [];
    config.forEach(attr => {
      defaults[attr.label] = attr.options[0];
    });
    return defaults;
  };

  // Initial load
  useEffect(() => {
    if (!selectedId) {
        setCurrentAttributes(getDefaultAttributes(selectedObjectType));
    }
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedObjectType]);

  const handleTypeChange = (newType: ObjectType) => {
    setSelectedObjectType(newType);
    const defaults = getDefaultAttributes(newType);
    setCurrentAttributes(defaults);

    // If an object is selected, update it immediately
    if (selectedId) {
        setObjects(objects.map(obj => 
            obj.id === selectedId 
            ? { ...obj, type: newType, label: OBJECT_TRANSLATIONS[newType], attributes: defaults } 
            : obj
        ));
    }
  };

  const handleAttributeChange = (label: string, value: string) => {
    const newAttrs = { ...currentAttributes, [label]: value };
    setCurrentAttributes(newAttrs);

    // If an object is selected, update it immediately
    if (selectedId) {
        setObjects(objects.map(obj => 
            obj.id === selectedId 
            ? { ...obj, attributes: newAttrs } 
            : obj
        ));
    }
  };

  // Handle selecting an object
  const handleObjectClick = (e: React.MouseEvent, obj: SceneObject) => {
      e.stopPropagation();
      setDraggingId(obj.id);
      setInteractionMode('move');
      setSelectedId(obj.id);
      
      // Sync form with selected object
      setSelectedObjectType(obj.type);
      setCurrentAttributes(obj.attributes || {});
  };

  // Helper to handle mouse move/drag
  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    
    // Normalized coordinates (0-100)
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));

    if (draggingId === 'camera') {
      if (interactionMode === 'rotate') {
        const centerX = rect.left + (camera.x / 100) * rect.width;
        const centerY = rect.top + (camera.y / 100) * rect.height;
        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        
        let deg = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        deg += 90;
        if (deg < 0) deg += 360;
        
        setCamera({ ...camera, rotation: deg });
      } else {
        setCamera({ ...camera, x, y });
      }
    } else {
      setObjects(objects.map(obj => obj.id === draggingId ? { ...obj, x, y } : obj));
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setInteractionMode('none');
  };

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingId, objects, camera, interactionMode]);

  const addObject = () => {
    // Determine what to add: if selected, duplicate? No, standard add new based on form.
    const newObj: SceneObject = {
      id: Math.random().toString(36).substr(2, 9),
      type: selectedObjectType,
      x: 50,
      y: 50,
      label: OBJECT_TRANSLATIONS[selectedObjectType],
      attributes: { ...currentAttributes } // Copy current state
    };
    setObjects([...objects, newObj]);
    
    // Select the new object
    setSelectedId(newObj.id);
  };

  const removeObject = (id: string) => {
    setObjects(objects.filter(o => o.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleBackgroundClick = () => {
      setSelectedId(null);
  };

  const renderFOV = () => {
    const fovAngle = 60;
    const length = 30;
    const rad1 = (camera.rotation - fovAngle/2 - 90) * (Math.PI / 180);
    const rad2 = (camera.rotation + fovAngle/2 - 90) * (Math.PI / 180);
    const x1 = camera.x + length * Math.cos(rad1);
    const y1 = camera.y + length * Math.sin(rad1);
    const x2 = camera.x + length * Math.cos(rad2);
    const y2 = camera.y + length * Math.sin(rad2);

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
        <path d={`M ${camera.x} ${camera.y} L ${x1} ${y1} L ${x2} ${y2} Z`} fill="rgba(255, 165, 0, 0.1)" />
        <line x1={`${camera.x}%`} y1={`${camera.y}%`} x2={`${x1}%`} y2={`${y1}%`} stroke="rgba(255, 165, 0, 0.6)" strokeWidth="1" strokeDasharray="4 2" />
        <line x1={`${camera.x}%`} y1={`${camera.y}%`} x2={`${x2}%`} y2={`${y2}%`} stroke="rgba(255, 165, 0, 0.6)" strokeWidth="1" strokeDasharray="4 2" />
      </svg>
    );
  };

  const category = getCategory(selectedObjectType);
  const activeAttributes = ATTRIBUTE_CONFIG[category] || [];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Control Panel */}
      <div className={`bg-gray-800 rounded-lg border p-3 flex flex-col gap-3 transition-colors ${selectedId ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-gray-700'}`}>
        
        {/* Top Row: Type Selection + Add Button */}
        <div className="flex items-center gap-2">
            <div className="flex flex-col shrink-0">
                <span className="text-sm text-gray-400 font-semibold uppercase tracking-wider">
                    {selectedId ? '編輯選取物件' : '新增物件類型'}
                </span>
                {selectedId && <span className="text-[10px] text-blue-400">正在修改地圖上的物件</span>}
            </div>
            
            <select 
                className="flex-1 bg-gray-900 border border-gray-600 text-gray-100 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
                value={selectedObjectType}
                onChange={(e) => handleTypeChange(e.target.value as ObjectType)}
            >
                <optgroup label="景觀設施 (New)">
                    <option value={ObjectType.LandscapeRock}>景觀石 (Rock)</option>
                    <option value={ObjectType.LandscapeLight}>景觀燈 (Light)</option>
                    <option value={ObjectType.WaterFeature}>水景設施 (Water)</option>
                    <option value={ObjectType.OutdoorPot}>景觀盆栽 (Pot)</option>
                </optgroup>
                <optgroup label="喬木 & 樹木">
                    <option value={ObjectType.TreeBroadleaf}>闊葉溫帶喬木</option>
                    <option value={ObjectType.TreeConifer}>松柏科樹</option>
                    <option value={ObjectType.TreePalm}>棕櫚樹</option>
                </optgroup>
                <optgroup label="灌木 & 地被">
                    <option value={ObjectType.ShrubSmall}>矮灌木</option>
                    <option value={ObjectType.ShrubMedium}>中灌木</option>
                    <option value={ObjectType.ShrubLarge}>大灌木</option>
                    <option value={ObjectType.ShrubGroundCover}>地被植物</option>
                </optgroup>
                <optgroup label="家具">
                    <option value={ObjectType.FurnitureChair}>椅子</option>
                    <option value={ObjectType.FurnitureTable}>桌子</option>
                </optgroup>
                <optgroup label="人物">
                    <option value={ObjectType.Man}>男人</option>
                    <option value={ObjectType.Woman}>女人</option>
                </optgroup>
            </select>
            
            {!selectedId ? (
                <button 
                    onClick={addObject}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium text-sm flex items-center gap-1 transition-colors shrink-0"
                >
                    <Plus size={16} /> 新增
                </button>
            ) : (
                <button 
                    onClick={() => setSelectedId(null)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200 font-medium text-sm flex items-center gap-1 transition-colors shrink-0"
                >
                    完成
                </button>
            )}
        </div>

        {/* Bottom Row: Dynamic Attributes */}
        {activeAttributes.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-gray-700">
             {activeAttributes.map((attr) => (
                <div key={attr.label} className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-medium">{attr.label}</label>
                  <select
                    className="bg-gray-900 border border-gray-600 text-gray-200 text-xs rounded p-1.5 focus:ring-1 focus:ring-blue-500"
                    value={currentAttributes[attr.label] || attr.options[0]}
                    onChange={(e) => handleAttributeChange(attr.label, e.target.value)}
                  >
                    {attr.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
             ))}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 w-full bg-slate-900 rounded-xl relative border-2 border-slate-700 overflow-hidden shadow-inner group"
        onMouseDown={handleBackgroundClick}
        style={{ 
            minHeight: '300px', 
            backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', 
            backgroundSize: '20px 20px',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat'
        }}
      >
        <div className="absolute top-2 left-2 text-xs text-slate-500 bg-black/50 px-2 py-1 rounded pointer-events-none z-30">
            平面配置圖 (點擊背景取消選取)
        </div>
        
        {renderFOV()}

        {/* Camera */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ left: `${camera.x}%`, top: `${camera.y}%` }}
        >
            <div 
                className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-900/50 border-2 border-white cursor-move relative"
                onMouseDown={(e) => { e.stopPropagation(); setDraggingId('camera'); setInteractionMode('move'); }}
            >
                <Camera className="text-white transform" style={{ transform: `rotate(${camera.rotation}deg)` }} size={20} />
                <div 
                    className="absolute w-4 h-4 bg-white rounded-full border-2 border-orange-500 cursor-pointer hover:bg-orange-100 flex items-center justify-center"
                    style={{ 
                        top: '-25px', left: '50%', marginLeft: '-8px',
                        transformOrigin: '50% 33px', 
                        transform: `rotate(${camera.rotation}deg)`
                    }}
                    onMouseDown={(e) => { e.stopPropagation(); setDraggingId('camera'); setInteractionMode('rotate'); }}
                >
                    <RotateCw size={10} className="text-orange-600" />
                </div>
            </div>
          <div className="mt-1 bg-black/70 text-white text-[10px] px-1.5 rounded whitespace-nowrap text-center pointer-events-none absolute top-10 left-1/2 -translate-x-1/2">
            攝影機
          </div>
        </div>

        {/* Objects */}
        {objects.map((obj) => (
          <div
            key={obj.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 flex flex-col items-center group/item`}
            style={{ left: `${obj.x}%`, top: `${obj.y}%` }}
            onMouseDown={(e) => handleObjectClick(e, obj)}
          >
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 transition-transform text-white
              ${getObjectColorClass(obj.type)}
              ${selectedId === obj.id ? 'border-yellow-400 ring-2 ring-yellow-400/50 scale-110 z-50' : 'border-white/30 hover:scale-110'}
            `}>
              {getObjectIcon(obj.type)}
            </div>
            
            {/* Context Menu / Tooltip */}
            <div className={`
                absolute top-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm border border-gray-700 text-white text-xs px-2 py-1 rounded shadow-xl 
                flex flex-col items-center pointer-events-none min-w-max transition-opacity z-40
                ${selectedId === obj.id ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'}
            `}>
                <span className="font-bold flex items-center gap-1">
                    {OBJECT_TRANSLATIONS[obj.type]}
                    {selectedId === obj.id && <Edit2 size={8} className="text-yellow-400" />}
                </span>
            </div>

            {/* Remove Button (Only visible on hover or selection) */}
             <button 
                onClick={(e) => { e.stopPropagation(); removeObject(obj.id); }}
                className={`
                    absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow-sm transition-opacity z-50
                    ${selectedId === obj.id ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'}
                `}
            >
                <XCircle size={12} />
            </button>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-center text-gray-500 italic">
          點擊物件可進行編輯屬性，拖曳橘色圖標移動攝影機。
      </p>
    </div>
  );
};

export default SpatialCanvas;
