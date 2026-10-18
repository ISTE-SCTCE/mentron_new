import React from 'react';
export default class ErrorBoundary extends React.Component {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<main className="empty-state" role="alert"><h1>Unable to open this page.</h1><p>Refresh to try again. If this continues, contact ISTE support.</p><button className="primary-button" onClick={()=>location.reload()}>Refresh page</button><a href="mailto:istesctce@gmail.com">Contact ISTE</a></main>:this.props.children;}
}
