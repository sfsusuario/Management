import React from "react";
import Management from "./components/Management";
import { Helmet } from 'react-helmet';

const App = () => {
  return (
    <div>
      <Helmet>
        <title>Task Management Board</title>
        <meta name="description" content="A drag and drop task management board for organizing projects and tracking progress" />
      </Helmet>
      <Management />
    </div>
  );
};

export default App;
