import React, { useState, useEffect } from "react";
import { FaCheck, FaPlus } from "react-icons/fa6";
import * as serverApi from "../apis/server-api";
import * as nativeApi from "../apis/native-api";
import * as offlineApi from "../apis/offline";
import toast from "react-hot-toast";
import "./login.css";

const Login = ({setSignedIn, signedInState, setOnline, onlineState}) => {
    const [input, setInput] = useState('');
    const [user, setUser] = useState('');
    const [serverUrl, setServerUrl] = useState('');
    const [needsServer, setNeedsServer] = useState(true);
    const [users, setUsers] = useState([]);
    const [showLoginInput, setShowLoginInput] = useState(false);
    const [showUsernameInput, setShowUsernameInput] = useState(false);
    const [clickedUser, setClickedUser] = useState('');

    function onChange(e) {
        setInput(e.target.value);
    }
    async function onSubmit(e) {
        if (showUsernameInput) {
            await serverApi.createUser(input);
            await updateUsers();
            setShowUsernameInput(false);
            setInput('');
        } else if (needsServer) {
            localStorage.setItem('serverApiUrl', input);
            serverApi.updateServerUrl();
            const isOnline = await serverApi.getIsOnline();
            if (isOnline) {
                toast.success('Server found!');
                setNeedsServer(false);
            } else {
                toast.error('Server not found.');
            }
        } else if (showLoginInput) {
            const result = await serverApi.loginAsUser(clickedUser, input);
            console.log(result);
            if (result.success) {
                setSignedIn('true');
                toast.success("Signed in successfully!");
            } else {
                toast.error("Failed to sign in.");
            }
        } else {
            const result = await serverApi.login(input);
            if (result.success) {
                setUser(result.userID);
                if (result.userID !== 'none') {
                    setSignedIn('true');
                } else {
                    const users = await serverApi.getUsers();
                    setUsers(users);
                }
                toast.success("Signed in successfully!");
            } else {
                toast.error("Failed to sign in.");
            }
        }
    }

    async function onUserClick(usr) {
        setShowUsernameInput(false);
        console.log(usr);
        setClickedUser(usr._id);
        console.log(usr.password);
        if (usr.password == 'true') {
            setShowLoginInput(true);
        } else {
            setShowLoginInput(false);
            const result = await serverApi.loginAsUser(usr._id, '');
            console.log(result);
            if (result.success) {
                setSignedIn('true');
            }
        }
    }
    async function updateUsers() {
        const online = await serverApi.getIsOnline();
        setOnline(online);
        if (!online) return;
        const users = await serverApi.getUsers();
        setUsers(users);
    }
    useEffect(() => {
        //localStorage.removeItem('token');
        async function updateServerRequirement() {
            const url = localStorage.getItem('serverApiUrl')
            if (url) {
                if (await offlineApi.hasDownloads()) {
                    setNeedsServer(false);
                } else {
                    const isOnline = await serverApi.getIsOnline();
                    setNeedsServer(!isOnline);
                }
            } else {
                setNeedsServer(true);
            }
            setServerUrl(url);
        }
        async function login() {
            await updateServerRequirement();
            const isOnline = await serverApi.getIsOnline();
            console.log(isOnline);
            console.log(needsServer);
            if (!isOnline && needsServer) return;
            const isMobile = await nativeApi.getPlatform() == 'Capacitor';
            setOnline(isOnline);
            if (!isOnline) {
                setSignedIn('true'); 
                return;
            }
            const result = await serverApi.checkLogin();
            if (result.userID != 'none') {
                if (result.success == true) {
                    setSignedIn('true');
                }
            }
        }
        if (signedInState == 'loggedOut') {
            updateServerRequirement();
            setUser('none');
            updateUsers();
        } else {
            login();
        }
        
    }, [signedInState]);
    return (
        <div className="center">
            {needsServer &&
                <>
                    <h1>Server API URL</h1>
                    <form className="search-form" onSubmit={(e) => { e.preventDefault(); onSubmit(e);}}>
                        <input type="text" onChange={onChange} placeholder="http://xxx.xx.xxx.xx:yyyy/"></input>
                        <button>Login</button>
                    </form>
                </>
            }
            {(!needsServer && user === 'none') &&
                <>
                <h1> Select Profile </h1>
                <div className="users-container">
                    {users.map((user, index) => 
                        <div className="user-button PlayButton2" onClick={() => onUserClick(user)}>
                            {user.username}
                        </div>
                    )}
                    {!showLoginInput &&
                        <button className="PlayButton2" onClick={()=>setShowUsernameInput(true)}> <FaPlus /> </button>
                    }
                </div>
                {showUsernameInput &&
                    <form className="search-form" onSubmit={(e) => { e.preventDefault(); onSubmit(e);}}>
                        <input type="text" onChange={onChange} placeholder="Enter username..."></input>
                        <button> <FaCheck /> </button>
                        <button onClick={()=>{setShowUsernameInput(false); setInput("");}}> Cancel </button>
                    </form>
                }
                
                {showLoginInput &&
                    <form className="search-form" onSubmit={(e) => { e.preventDefault(); onSubmit(e);}}>
                        <input type="password" onChange={onChange} placeholder="Enter password..."></input>
                        <button>Login</button>
                    </form>
                }
                </>
            }
            {(!needsServer && user === '') &&
                <>
                    <h1>Log In</h1>
                    <form className="search-form" onSubmit={(e) => { e.preventDefault(); onSubmit(e);}}>
                        <input type="password" onChange={onChange} placeholder="Enter password..."></input>
                        <button>Login</button>
                    </form>
                </>
            }
            
        </div>
    );
}

export default Login;