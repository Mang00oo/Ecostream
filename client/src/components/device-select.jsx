import React, { useState, useEffect, useRef } from 'react';
import { Panel } from "react-resizable-panels";
import * as serverApi from '../apis/server-api';
import { FaAngleLeft, FaCheck } from "react-icons/fa6";
import { IoGlobeOutline, IoPhonePortraitOutline, IoDesktopOutline, IoClose } from 'react-icons/io5';
import './DeviceSelect.css';

const Device = ({device}) => {
    const [isChecked, setIsChecked] = useState(false);
    const toggleDevice = async (toggle) => {
        serverApi.toggleDevicePlayback(device.id, toggle);
    }
    useEffect(()=> {setIsChecked(device.isPlaying)}, [device.isPlaying]);
    return(
        <div className="DeviceSelectContainer">
            {device.type == "Web" &&
                <IoGlobeOutline size="25px"/>
            }
            {device.type == "Capacitor" &&
                <IoPhonePortraitOutline size="25px" />
            }
            {device.type == "Electron" &&
                <IoDesktopOutline size="25px" />
            }
            <h4>{device.name}</h4>
            <button className="PlayButton" onClick={()=>{setIsChecked(!isChecked); toggleDevice(!isChecked)}}> 
                {isChecked? <FaCheck /> : <IoClose />} 
                </button>
        </div>
    );
}

const DeviceSelect = ({reverseCenterContent}) => {
    const [devices, setDevices] = useState({});

    useEffect(()=> {
        const updateDevices = async() => {
            const response = await serverApi.getDevices();
            setDevices(response);
        }
        updateDevices();
        serverApi.subscribeToDeviceListUpdateEvent((devices)=>{
            console.log(devices);
            setDevices(null);
            setDevices(devices);
        });
    }, []);
    return(
        <Panel defaultSize={40} minSize={'40%'} className="panel">
            <h2>Select Devices</h2>
            <button className="CenterCloseButton" onClick={reverseCenterContent}>
                  <FaAngleLeft /> ‎ Back
            </button>
            {devices.length > 0 ? devices.map((device, key) => 
                <Device device={device} key={key}></Device>
            ) : <p> Loading Devices... </p>}
        </Panel>
    )
}
export default DeviceSelect