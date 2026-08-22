import React from 'react';
import { useState, useEffect } from 'react';
import { Panel } from "react-resizable-panels";
import { IoClose } from "react-icons/io5";
import { FaTrash } from 'react-icons/fa6';
import toast from "react-hot-toast";
import * as serverApi from "../apis/server-api";

const Settings = ({ reverseCenterContent }) => {
    const [serverUrl, setServerUrl] = useState('');
    const [username, setUsername] = useState('');
    useEffect(() => {
        setServerUrl(localStorage.getItem("serverApiUrl"));
        async function init() {
            setUsername(await serverApi.getUsername());
        }
        init();
    }, []);
    return (
        <Panel defaultSize={30} minSize={'12%'} className="panel" collapsible={true}>
            <h2> Settings </h2>
            <button className="CenterCloseButton" onClick={reverseCenterContent}> <IoClose /> </button>
            <h3 style={{marginLeft: '12px'}}>Server API URL</h3>
            <form className="search-form" onSubmit={(e) => {
                e.preventDefault(); 
                toast.success("API URL saved!");
                localStorage.setItem("serverApiUrl", serverUrl);
            }}>
                <input type="text" placeholder="http://xxx.xx.xxx.xx:yyyy/" value={serverUrl} onChange={(e)=>{setServerUrl(e.target.value)}}></input>
                <button>Save</button>
            </form>

            <h3 style={{marginLeft: '12px'}}>User Management</h3>
            <form className="search-form" onSubmit={async (e) => {
                e.preventDefault();
                toast.promise(serverApi.renameUser(username), {
                    loading: 'Renaming...',
                    success: 'Renamed successfully!',
                    error: 'Failed to rename.'
                });
            }}>
                <input type="text" value={username} onChange={(e)=>{setUsername(e.target.value)}}></input>
                <button>Save</button>
            </form>
            <button onClick={()=>{serverApi.deleteUser(); localStorage.removeItem('token');}} className="PlayButton2" style={{marginLeft: '50%', marginTop: '10px', transform: 'translate(-50%, 0)'}}> <FaTrash /> Delete User </button>
        </Panel>
    )
}
export default Settings;