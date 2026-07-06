import React, { useState } from "react";
import * as serverApi from "../apis/server-api";
import toast from "react-hot-toast"

const Login = ({setSignedIn}) => {
    const [input, setInput] = useState('');
    const [user, setUser] = useState('');
    const [users, setUsers] = useState([]);
    const [showLoginInput, setShowLoginInput] = useState(false);
    const [clickedUser, setClickedUser] = useState('');

    function onChange(e) {
        setInput(e.target.value);
    }
    async function onSubmit(e) {
        if (showLoginInput) {
            const result = await serverApi.loginAsUser(clickedUser, input);
            console.log(result);
            if (result.success) {
                setSignedIn(true);
                toast.success("Signed in successfully!");
            } else {
                toast.error("Failed to sign in.");
            }
        } else {
            const result = await serverApi.login(input);
            if (result.success) {
                setUser(result.userID);
                if (result.userID !== 'none') {
                    setSignedIn(true);
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
        console.log(usr);
        setClickedUser(usr._id);
        if (usr.password == 'true') {
            setShowLoginInput(true);
        } else {
            setShowLoginInput(false);
            const result = await serverApi.loginAsUser(usr._id, '');
            if (result.success) {
                setSignedIn(true);
            }
        }
    }
    return (
        <div className="center">
            {user == 'none' &&
                <>
                <h1> Select Profile </h1>
                {users.map((user, index) => 
                    <div onClick={() => onUserClick(user)}> {user.username} </div>
                )}
                {showLoginInput &&
                    <form className="search-form" onSubmit={(e) => { e.preventDefault(); onSubmit(e);}}>
                        <input type="password" onChange={onChange} placeholder="Enter password..."></input>
                        <button>Login</button>
                    </form>
                }
                </>
            }
            {user == '' &&
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