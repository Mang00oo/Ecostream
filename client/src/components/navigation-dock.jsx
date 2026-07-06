import React, { useState, useEffect } from 'react';
import './NavigationDock.css';
import { IoLibrary } from "react-icons/io5";
import { FaSearch } from "react-icons/fa";

const NavigationDock = ({ setCenterContent }) => {
    return(
        <div className="navigation-dock">
            <button className="PlayButton" onClick={()=>{setCenterContent('library')}}><IoLibrary /></button>
            <button className="PlayButton"><FaSearch /></button>
        </div>
    );
}

export default NavigationDock;