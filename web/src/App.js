import React, { PureComponent } from "react"
import styled from "styled-components"
import io from "socket.io-client"

const FullScreen = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  transition: background-color 1s ease;

  background-color: ${({ color }) => {
    switch (color) {
      case "ping":
        return "lightgreen"
      case "pong":
        return "lightpink"
      default:
        return "#fafafa"
    }
  }};
`

const Text = styled.div`
  font-size: 100px;
  text-transform: uppercase;
  font-family: font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif; 
  font-weight: 300;
  color: white;
`

class App extends PureComponent {
  state = {
    current: null
  }

  componentDidMount() {
    const socket = io("http://localhost:8080")

    socket.on("ping-pong", msg => {
      this.setState({ current: msg })
    })
  }

  render() {
    return (
      <FullScreen className="App" color={this.state.current}>
        <Text>{this.state.current}</Text>
      </FullScreen>
    )
  }
}

export default App
