import React, { useState, useEffect, useRef } from "react";
import * as serverApi from "../apis/server-api";
import toast from "react-hot-toast"

const Login = ({setSignedIn}) => {
    const [input, setInput] = useState('');
    function onChange(e) {
        setInput(e.target.value);
    }
    async function onSubmit(e) {
        const success = await serverApi.login(input);
        if (success) {
            setSignedIn(true);
            toast.success("Signed in successfully!");
        } else {
            toast.error("Failed to sign in.");
        }
    }
    return (
        <div className="center">
            <h1>Log In</h1>
            <form className="search-form" onSubmit={(e) => { e.preventDefault(); onSubmit(e);}}>
                <input type="password" onChange={onChange}></input>
                <button>Login</button>
            </form>
        </div>
    );
}

export default Login;