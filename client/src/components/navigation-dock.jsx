import React, { useState, useEffect } from 'react';
import './NavigationDock.css';
import { IoLibrary } from "react-icons/io5";
import { FaSearch, FaUser } from "react-icons/fa";
import { FaGear } from "react-icons/fa6";

const NavigationDock = ({ setCenterContent, setSignedIn }) => {
    return(
        <div className="navigation-dock">
            <button className="PlayButton" onClick={()=>{setCenterContent('library')}}><IoLibrary /></button>
            <button className="PlayButton" onClick={()=>{setCenterContent('search')}}><FaSearch /></button>
            <button className="PlayButton" onClick={()=>{setSignedIn('loggedOut')}}><FaUser /></button>
            <button className="PlayButton" onClick={()=>{setCenterContent('settings')}}><FaGear /></button>
        </div>
    );
}

export default NavigationDock;