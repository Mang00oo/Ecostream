import React from 'react';
import { useState, useEffect } from 'react';
import { Panel } from "react-resizable-panels";
import { IoClose } from "react-icons/io5";
import toast from "react-hot-toast";

const Settings = ({ reverseCenterContent }) => {
    const [serverUrl, setServerUrl] = useState('');
    useEffect(() => {
        setServerUrl(localStorage.getItem("serverApiUrl"));
    }, []);
    return (
        <Panel defaultSize={30} minSize={'12%'} className="panel" collapsible={true}>
            <h2> Settings </h2>
            <h3 style={{marginLeft: '12px'}}>Server API URL</h3>
            <button className="CenterCloseButton" onClick={reverseCenterContent}> <IoClose /> </button>
            <form className="search-form" onSubmit={(e) => {
                e.preventDefault(); 
                toast.success("API URL saved!");
                localStorage.setItem("serverApiUrl", serverUrl);
            }}>
                <input type="text" placeholder="http://xxx.xx.xxx.xx:yyyy/" value={serverUrl} onChange={(e)=>{setServerUrl(e.target.value)}}></input>
                <button>Save</button>
            </form>
        </Panel>
    )
}
export default Settings;