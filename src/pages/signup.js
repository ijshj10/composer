import { useContext, useState } from "react";
import { useHistory } from "react-router";
import Header from "../components/header"
import ROUTES from "../constants";
import FirebaseContext from "../context/firebase";
import doesUsernameExist from '../service/firebase';

export default function SignUp() {    
  const history = useHistory();
  const { firebase } = useContext(FirebaseContext);

  const [username, setUsername] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const isInvalid = username == '' || password === '' || emailAddress === '';

  const handleSignUp = async (event) => {
    event.preventDefault();
    const usernameExists = await doesUsernameExist(username);
    if(!usernameExists) {
      try {
        const createdUserResult = await firebase
          .auth()
          .createUserWithEmailAndPassword(emailAddress, password);
        
          await createdUserResult.user.updateProfile({
            displayName: username
          });

          await firebase
            .firestore()
            .collection('users')
            .add({
              userId: createdUserResult.user.uid,
              username: username.toLowerCase(),
              emailAddress: emailAddress.toLowerCase(),
              permission: 0,
            });
          history.push(ROUTES.MAIN);
      }
      catch(error) {
        setUsername('');
        setEmailAddress('');
        setPassword('');
        setError(error.message);
      }
    } else {
      setUsername('');
      setError('That username is already taken, please try another.');
    }  
  };


return (
  <>
    <Header />
    <div className="flex flex-col mt-64 justify-center itmes-center">
			<div className="flex flex-col self-center">
				{error && <p className="mb-4 text-xs text-red-500">{error}</p>}
				<form onSubmit={handleSignUp} method="POST">
          <input tpye="text" placeholder="Username"
            className="text-sm w-full mr-3 py-5 px-4 h-2 border rounded mb-2"
            onChange={({target}) => setUsername(target.value)}
            value={username} />
          
					<input type="text" placeholder="Email address" 
						className="text-sm w-full mr-3 py-5 px-4 h-2 border rounded mb-2" 
						onChange={({target}) => setEmailAddress(target.value)}
						value={emailAddress} />

					<input type="password" placeholder="Password" 
					className="text-sm w-full mr-3 py-5 px-4 h-2 border rounded mb-2" 
					onChange={({target}) => setPassword(target.value)}
					value={password}/>

					<button disabled={isInvalid} type="submit" className={`bg-blue-500 text-white rounded h-8 font-bold w-full ${isInvalid && 'opacity-50'}`}>
						Sign up
					</button>
				</form>
			</div>
    </div>       
  </>
  );
}

