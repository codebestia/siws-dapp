"use client"
import { useState } from 'react'
import './page.css'
import { web3Accounts, web3Enable, web3FromAddress, web3FromSource } from '@polkadot/extension-dapp'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { SiwsMessage } from "@talismn/siws"
import { message, Input } from 'antd';


function App() {
  const [activeExtension, setActiveExtension] = useState(null);
  const [accountConnected, setAccountConnected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [signedIn, setSignIn] = useState(false);
  const [jwtToken, setJwtToken] = useState(null);
  const [amountToBurn, setAmountToBurn] = useState(0);

  const truncateMiddle = (address)=>{
    let midPoint = parseInt(address.length / 2)
    return address.slice(0, midPoint- 10) +"........"+ address.slice(midPoint+10, address.length)
  }

  const connectExtension = async()=>{

    setLoading(true)
    try{
      let activeExtension = await web3Enable("Codebestia Encode Hackathon");
        setActiveExtension(activeExtension);
        console.log(activeExtension)

        let accounts = null;
        if(activeExtension && activeExtension.length > 0){
          accounts = await web3Accounts()
        }else{
          message.error("No Account Found");
          throw new Error("No Account Found")
        }
        setAccountConnected(accounts);
        message.success("Account Connected");
    }catch(e){
      console.log(e)
      message.error("Connection Error: "+e)
    }
    setLoading(false);

    
  }
  const initTransaction = async ()=>{
    if(parseInt(amountToBurn) <= 0){
      message.error("Enter an amount greater than zero")
      return
    }
    setTransactionLoading(true)
    const wsProvider = new WsProvider("wss://westend-rpc.polkadot.io");
    const api = await ApiPromise.create({provider: wsProvider});

    const injector = await web3FromAddress(accountConnected[0].address);

    const tx = api.tx.balances.transferKeepAlive('5GbKMhCgYSVLRy62ZXFZuySSuLQcK7SstXbf9EvZpebkndGZ',parseFloat(amountToBurn));
    
    tx.signAndSend(accountConnected[0].address,{signer: injector.signer},({status})=>{
      if(status.isInBlock){
        console.log(`Completed transaction at block hash ${status.asInBlock.toString()}`);
        message.success(`Completed transaction at block hash ${status.asInBlock.toString()}`);
      }else{
        console.log(`Current Status: ${status.type}`);
        message.info(`Current Status: ${status.type}`);
      }
      setTransactionLoading(false)
    }).catch((error)=>{
      console.log(`:( transaction failed`,error);
      message.error(`:( transaction failed: `+ error);
      setTransactionLoading(false)
    })
  }
  const handleSignIn = async () => {
    setLoading(true)
    const nonceRes = await fetch("api/getnonce")
    const data = await nonceRes.json()
    const {nonce} = data
    const siws = new SiwsMessage({
      domain: "localhost",
      uri: "http://localhost:5173",
      address: accountConnected[0].address,
      nonce, 
      statement: "Welcome to my SIWS workshop application",
      chainName: "Polkadot",
    })
    try{
      const injectedExtension = await web3FromSource(accountConnected[0].meta.source)
      const signed = await siws.sign(injectedExtension)
      const verifyRes = await fetch("/api/verify", {
        method: "POST",
        body: JSON.stringify({ ...signed, address: accountConnected[0].address }),
      })
      const verified = await verifyRes.json()
      if (verified.error) throw new Error(verified.error)
      message.success("Sign In Successful")
      setSignIn(true)
      setJwtToken(verified.jwtToken)
    }catch(e){
      message.error("Sign Failed: " + e)
    }
    setLoading(false)
  
    
  }
  return (
    <>
     <div className='nav'>
      <div>
        <p className='nav-brand'>Encode SIWS Workshop</p>
      </div>
      <div>
        {!accountConnected?(
        <button className='btn' onClick={connectExtension} disabled={loading} >
          {
            loading?("Connecting"):("Connect")
          }
        </button>
        ):(
          <button className='btn btn-danger' onClick={()=>setAccountConnected(null)}>
            Disconnect
          </button>
        )}
        
      </div> 
     </div>
     <div className='content'>
          {!accountConnected?(
            <div className='page-center-cover'>
              <h2>Connect Wallet to Use application</h2>
                <button className='btn' onClick={connectExtension} disabled={loading} >
                  {
                    loading?("Connecting"):("Connect")
                  }
                </button>
            </div>
          ):(
            <>
            {!signedIn?(
              <div className='box'>
                <h2 style={{textAlign:"center", marginTop:10, marginBottom: 10}}>Sign In with Substrate</h2>
                <div className='card'>
                  <h3 className='header'>Selected Account</h3>
                  <p className='body'>{truncateMiddle(accountConnected[0].address)}</p>
                </div>
                <button onClick={handleSignIn} disabled={loading} className='btn btn-block'>
                  {
                    loading? ("Signing in..."):("SignIn")
                  }
                </button>
              </div>
            ):(
              <div className='box'>
              <h3 className='text-bold'>Selected Extension: {activeExtension[0].name}</h3>
              <p style={{marginTop: 10, marginBottom: 10 , color:"gray"}}>Account: {truncateMiddle(accountConnected[0].address)} </p>
              <p>Enter WND Amount to Burn</p>
              <Input value={amountToBurn} 
              onChange={(e)=>setAmountToBurn(e.target.value)} 
              type='number'  
              style={{background:"transparent",color:"white"}}
              placeholder='Enter WND Amount to burn' />
            <button className='btn' style={{marginTop: 10}} onClick={initTransaction} disabled={transactionLoading}>
            {
              transactionLoading?(`Burning...`):("Burn WND")
            }
            </button>
            </div>
            )}
            </>
            
          )}
     </div>
    </>
  )
}

export default App
