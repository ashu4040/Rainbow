import React from "react";
import { menuItemsData } from "../assets/assets";
import { NavLink } from "react-router-dom";

const MenuItems = ({ setSidebarOpen }) => {
  return (
    <div className="px-6 space-y-1 font-medium">
      {menuItemsData.map(({ to, label, Icon, hoverClasses, activeClasses }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            // don't append text-gray-600 after activeClasses (that can override it).
            `px-3.5 py-2 flex items-center gap-3 rounded-xl transition-colors duration-150 ${
              isActive ? activeClasses : `${hoverClasses} text-gray-600`
            }`
          }
        >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default MenuItems;
