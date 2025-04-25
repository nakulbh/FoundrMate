'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Inbox, Star, PenLine, Tag, Briefcase, User, Users, UserCircle, Box, Plus, X, Trash2, Settings, Circle } from 'lucide-react'

// Define proper interfaces for type safety
interface LabelItem {
  name: string;
  icon: React.ReactNode;
  color?: string;
}

interface MenuOption {
  name: string;
  icon: React.ReactNode;
  category?: string;
  data?: LabelItem[];
}

// Pre-defined label colors
const labelColors = [
  "#4299E1", // blue
  "#48BB78", // green
  "#F6AD55", // orange
  "#FC8181", // red
  "#9F7AEA", // purple
  "#ED64A6", // pink
  "#718096", // gray
];

const options: MenuOption[] = [
    {name: "Inbox", icon: <Inbox className="w-4 h-4 mr-2" />},
    {name: "Starred", icon: <Star className="w-4 h-4 mr-2" />},
    {name: "Draft", icon: <PenLine className="w-4 h-4 mr-2" />},
    {name: "Labels", icon: <Tag className="w-4 h-4 mr-2" />, category: 'labels', data: [
        {name: "Work", icon: <Briefcase className="w-4 h-4 mr-2" />, color: "#4299E1"},
        {name: "Personal", icon: <User className="w-4 h-4 mr-2" />, color: "#48BB78"},
        {name: "Family", icon: <UserCircle className="w-4 h-4 mr-2" />, color: "#F6AD55"},
        {name: "Friends", icon: <Users className="w-4 h-4 mr-2" />, color: "#9F7AEA"},
        {name: "Other", icon: <Box className="w-4 h-4 mr-2" />, color: "#718096"}
    ]},
]

interface MainProps {
  email?: string;
  onSelectItem?: (itemName: string) => void;
}

// Extract components for reusability and cleaner code
const MenuItem = ({ 
  name, 
  icon, 
  isActive, 
  onClick,
  color,
  onDelete,
  isCustomLabel = false
}: { 
  name: string; 
  icon: React.ReactNode; 
  isActive: boolean; 
  onClick: () => void;
  color?: string;
  onDelete?: () => void;
  isCustomLabel?: boolean;
}) => (
  <div 
    className={`menu-item p-2 my-1 rounded-md cursor-pointer transition-colors flex items-center justify-between ${
      isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
    }`}
    onClick={onClick}
    role="button"
    aria-pressed={isActive}
  >
    <div className="flex items-center overflow-hidden">
      {color ? (
        <Circle className="w-3 h-3 mr-2" fill={color} color="transparent" />
      ) : icon}
      <span className="truncate max-w-[160px]" title={name}>{name}</span>
    </div>
    
    {isCustomLabel && onDelete && (
      <button 
        className={`delete-btn opacity-0 group-hover:opacity-100 hover:bg-gray-300 p-1 rounded-full transition-opacity ${
          isActive ? 'text-white hover:bg-blue-600' : 'text-gray-500'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label={`Delete ${name} label`}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    )}
  </div>
);

export default function Main({ email, onSelectItem }: MainProps) {
  const [activeItem, setActiveItem] = useState("Inbox");
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["labels"]);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(labelColors[0]);
  const [customLabels, setCustomLabels] = useState<LabelItem[]>([]);
  const [formError, setFormError] = useState("");
  const labelInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Focus input when adding a new label
  useEffect(() => {
    if (isAddingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
    }
  }, [isAddingLabel]);

  // Handle click outside the form to cancel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsAddingLabel(false);
        setFormError("");
      }
    }
    
    if (isAddingLabel) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isAddingLabel]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const handleItemClick = (itemName: string) => {
    setActiveItem(itemName);
    if (onSelectItem) {
      onSelectItem(itemName);
    }
  };

  const handleAddLabel = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newLabelName.trim()) {
      setFormError("Label name is required");
      return;
    }
    
    // Check for duplicate name
    const isDuplicate = [...options.flatMap(opt => opt.data || []), ...customLabels]
      .some(label => label.name.toLowerCase() === newLabelName.toLowerCase());
    
    if (isDuplicate) {
      setFormError("Label with this name already exists");
      return;
    }

    setCustomLabels(prev => [
      ...prev, 
      {
        name: newLabelName.trim(),
        icon: <Tag className="w-4 h-4 mr-2" />,
        color: newLabelColor
      }
    ]);
    
    setNewLabelName("");
    setNewLabelColor(labelColors[0]);
    setIsAddingLabel(false);
    setFormError("");
  };

  const handleDeleteLabel = (labelName: string) => {
    if (activeItem === labelName) {
      setActiveItem("Inbox");
      if (onSelectItem) {
        onSelectItem("Inbox");
      }
    }
    
    setCustomLabels(prev => prev.filter(label => label.name !== labelName));
  };

  const cancelAddLabel = () => {
    setIsAddingLabel(false);
    setNewLabelName("");
    setFormError("");
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      cancelAddLabel();
    }
  };

  return (
    <div className=" bg-gray-50 w-64 min-h-screen  border border-gray-200 p-4 ">
      <div className="flex flex-row items-center gap-2 mb-6 p-3  rounded-lg ">
        <div className='w-7 h-7 rounded-full bg-gray-500'></div>
        <h3 className="text-lg font-bold text-gray-800 truncate">{email || "example@mail.com"}</h3>
      </div>
      
      <nav className="menu-items" aria-label="Mail navigation">
        {options.map((option, index) => (
          <div key={index} className="group">
            {!option.category ? (
              <MenuItem 
                name={option.name}
                icon={option.icon}
                isActive={activeItem === option.name}
                onClick={() => handleItemClick(option.name)}
              />
            ) : (
              <div className="category mb-2">
                <div className="category-header p-2 flex justify-between items-center rounded-md hover:bg-gray-100">
                  <div 
                    className="flex items-center flex-grow cursor-pointer rounded-md py-1 px-1"
                    onClick={() => toggleCategory(option.category!)}
                    role="button"
                    aria-expanded={expandedCategories.includes(option.category!)}
                  >
                    <span className="mr-2 text-xs transition-transform duration-200">
                      {expandedCategories.includes(option.category!) ? '▼' : '▶'}
                    </span>
                    {option.icon}
                    <span className="font-medium">{option.name}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      setIsAddingLabel(true);
                    }}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    title="Add new label"
                    aria-label="Add new label"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {expandedCategories.includes(option.category!) && (
                  <div className="category-items pl-4">
                    {isAddingLabel && (
                      <form 
                        ref={formRef}
                        onSubmit={handleAddLabel} 
                        className="flex flex-col p-3 my-2 bg-white rounded-md shadow-sm border border-gray-200"
                        onKeyDown={handleKeyDown}
                      >
                        <div className="flex items-center mb-2">
                          <input
                            ref={labelInputRef}
                            type="text"
                            value={newLabelName}
                            onChange={(e) => {
                              setNewLabelName(e.target.value);
                              setFormError("");
                            }}
                            placeholder="New label name"
                            className="flex-grow text-sm p-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            maxLength={30}
                            aria-label="New label name"
                          />
                        </div>
                        
                        {formError && (
                          <p className="text-red-500 text-xs mb-2">{formError}</p>
                        )}
                        
                        <div className="color-picker mb-2">
                          <label className="block text-xs text-gray-600 mb-1">Label color:</label>
                          <div className="flex gap-1 flex-wrap">
                            {labelColors.map((color, i) => (
                              <button
                                key={i}
                                type="button"
                                className={`w-5 h-5 rounded-full transition-all ${
                                  newLabelColor === color ? 'ring-2 ring-offset-1 ring-gray-700' : ''
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => setNewLabelColor(color)}
                                aria-label={`Select color ${i + 1}`}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2 mt-1">
                          <button 
                            type="button" 
                            onClick={cancelAddLabel}
                            className="px-2 py-1 text-xs rounded-md hover:bg-gray-200 transition-colors"
                            aria-label="Cancel"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                            aria-label="Add label"
                            disabled={!newLabelName.trim()}
                          >
                            Add
                          </button>
                        </div>
                      </form>
                    )}
                    
                    {option.data?.map((item, itemIndex) => (
                      <MenuItem
                        key={itemIndex}
                        name={item.name}
                        icon={item.icon}
                        color={item.color}
                        isActive={activeItem === item.name}
                        onClick={() => handleItemClick(item.name)}
                      />
                    ))}
                    
                    {customLabels.map((label, labelIndex) => (
                      <MenuItem
                        key={`custom-${labelIndex}`}
                        name={label.name}
                        icon={label.icon}
                        color={label.color}
                        isActive={activeItem === label.name}
                        onClick={() => handleItemClick(label.name)}
                        onDelete={() => handleDeleteLabel(label.name)}
                        isCustomLabel={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </nav>
      
      <div className="mt-auto pt-4 border-t border-gray-200 mt-4">
        <div className="flex items-center p-2 text-gray-600 hover:bg-gray-200 rounded-md cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          <span>Settings</span>
        </div>
      </div>
    </div>
  )
}
