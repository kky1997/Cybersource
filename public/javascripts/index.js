const vueinst = Vue.createApp({
    data() {
        return {
            // Keeps track of navigation
            currentPage: 0,
            lastPage : 0,
            // Login Info
            email: '',
            password: '',
            //signup modal
            showSignupModal: false,
            signupEmail: '',
            signupPass: '',
            firstName: '',
            lastName:'',
            // Data for incident table
            incidents: [],
            searchTerm: "",
            // Data for a specific incident
            attachmentName: "No file uploaded...",
            attachmentPath: "",
            dateReported: "",
            briefDescription: "",
            dateAttack: "",
            targets: "",
            attackers: "",
            authors: "",
            summary: "",
            attachmentUploadWarning: false,
            incidentId: -1,
            version: -1,
            maxVersion: [],
            editMode: false,
            // Data for menu button
            numberOfIncidentsPendingApproval: 0,
            // Determines whether loading screen should be shown
            loading: false,
            // admin related variable
            role: ''
        };
    },
    methods:
    {
        clearFields() {
            this.briefDescription = "";
            this.dateReported = "";
            this.attachmentName = "No file uploaded...";
            this.attachmentUploadWarning = false;
            this.maxVersion = [];
            this.version = -1;
            this.editMode = false;
            this.incidentId = -1;
            this.dateAttack = "";
            this.targets = "";
            this.attackers = "";
            this.authors = "";
            this.summary = "";
            this.attackflow_json = "";
            this.attachmentPath = "";
        },
        updateCurrentPageButtons() {
            const navButtons = document.querySelectorAll("header > nav > button");
            navButtons.forEach(navButton => {
                navButton.classList.remove("active");
                navButton.disabled= false;
            });

            let button = null;
            switch(Number(this.currentPage)) {
                case 1:
                    button = document.querySelector("#databaseButton");
                    this.clearFields();
                    break;
                case 2:
                    button = document.querySelector("#createIncidentButton");
                    this.clearFields();
                    break;
                case 3:
                    button = document.querySelector("#viewIncidentButton");
                    this.clearFields();
                    break;
                default:
                    return;
            }
            button.classList.add("active");
            button.disabled = true;
            if (Number(this.currentPage) == 1 || Number(this.currentPage) == 3) {
                this.getIncidents();
            }
        },
        getAttachmentName() {
            if (this.currentPage == 2) {
                this.attachmentName = document.querySelector("#incidentAttachment").value.replace("C:\\fakepath\\", "");
            } else {
                this.attachmentName = document.querySelector("#incidentAttachmentNew").value.replace("C:\\fakepath\\", "");
            }
        },
        login() {
            let logindata = {
                username: this.email,    // access the email data property.
                password: this.password  // access the password data property.
            };

            let req = new XMLHttpRequest();

            req.onreadystatechange = () => {  // Arrow function to retain the value of `this`
                if(req.readyState == 4 && req.status == 200) {

                    const responseData = JSON.parse(req.responseText);
                    this.role = responseData.role;

                    //reset variables so they are blank
                    this.email = "";
                    this.password = "";
                    this.currentPage = 1;
                    this.getIncidents();
                } else if(req.readyState == 4 && req.status == 401) {
                    alert('Login FAILED');
                }
            };
            req.open('POST', '/login');
            req.setRequestHeader('Content-Type', 'application/json');
            req.send(JSON.stringify(logindata));
        },
        openSignupModal() {
            this.showSignupModal = true; //show signup modal;
        },
        closeSignupModal() {
            this.showSignupModal = false; //close signup modal
        },
        signup() {

            let signupdata = {
                email: this.signupEmail,
                password: this.signupPass,
                firstName: this.firstName,
                lastName: this.lastName
            };

            let req = new XMLHttpRequest();

            req.onreadystatechange = () => {  // Arrow function to retain the value of `this`
                if(req.readyState == 4 && req.status == 200) {
                    //reset variables so they are blank
                    this.signupEmail = "";
                    this.signupPass = "";
                    this.firstName = "";
                    this.lastName = "";
                    //this.currentPage = 1;
                    //this.getIncidents();
                    alert('signup successful');
                } else if(req.readyState == 4 && req.status == 401) {
                    alert('signup FAILED');
                }
                else if(req.readyState == 4) {
                alert('Signup failed with status: ' + req.status);
                }
            };
            req.open('POST', '/signup');
            req.setRequestHeader('Content-Type', 'application/json');
            req.send(JSON.stringify(signupdata));

            this.showSignupModal = false; //close signup modal after submitting information
        },
        logout()
        {
            let req = new XMLHttpRequest();

            req.onreadystatechange = function(){
                if(req.readyState == 4 && req.status == 200){
                    alert('Logged Out');
                } else if(req.readyState == 4 && req.status == 403){
                    alert('Not logged in');
                }
            };

            req.open('POST','/logout');
            req.send();
        },
        getIncidents() {
            const incidentStatus = this.currentPage == 3 ? 1 : 2;

            let req = new XMLHttpRequest();

            req.onreadystatechange = () => {  // Arrow function to retain the value of `this`
                if (req.readyState == 4 && req.status == 200) {
                    this.incidents = JSON.parse(req.responseText).map((incident) => {
                        const formatter = new Intl.DateTimeFormat(navigator.language, {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric"
                        });
                        incident.dateReported = formatter.format(new Date(incident.dateReported));
                        if (!incident.briefDescription) {
                            incident.briefDescription = "ERROR: NO DATA PRESENT!";
                            incident.error = "red";
                        }
                        return incident;
                    });
                    this.updateNumberOfIncidentsPendingApproval();
                }
            };
            req.open('GET', `/users/incidents?status=${incidentStatus}&searchTerm=${this.searchTerm}`);
            req.setRequestHeader('Content-Type','application/json');
            req.send();
        },
        getIncident(id, version) {
            let req = new XMLHttpRequest();

            req.onreadystatechange = () => {  // Arrow function to retain the value of `this`
                if (req.readyState == 4 && req.status == 200) {
                    this.incidents = JSON.parse(req.responseText).map((incident) => {
                        const formatter = new Intl.DateTimeFormat(navigator.language, {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric"
                        });
                        incident.dateReported = formatter.format(new Date(incident.dateReported));
                        incident.dateAttack = formatter.format(new Date(incident.dateAttack));
                        return incident;
                    });
                    const dateReportedRaw = new Date(this.incidents[0].dateReported);
                    let year = dateReportedRaw.toLocaleString("default", { year: "numeric" });
                    let month = dateReportedRaw.toLocaleString("default", { month: "2-digit" });
                    let day = dateReportedRaw.toLocaleString("default", { day: "2-digit" });

                    const dateAttackRaw = new Date(this.incidents[0].dateAttack);
                    let year_attack = dateAttackRaw.toLocaleString("default", { year: "numeric" });
                    let month_attack = dateAttackRaw.toLocaleString("default", { month: "2-digit" });
                    let day_attack = dateAttackRaw.toLocaleString("default", { day: "2-digit" });

                    this.dateAttack = year_attack + "-" + month_attack + "-" + day_attack;
                    this.dateReported = year + "-" + month + "-" + day;
                    this.briefDescription = this.incidents[0].briefDescription;
                    this.attachmentName = this.incidents[0].attachment_path;
                    this.attachmentPath = this.attachmentName;
                    const substringStart = this.attachmentName.indexOf("-") + 2;
                    this.attachmentName = this.attachmentName.substring(substringStart);
                    this.targets = this.incidents[0].targets;
                    this.authors = this.incidents[0].authors;
                    this.summary = this.incidents[0].summary;

                    this.attackers = this.incidents[0].attackers;

                    if (this.attackflow_json.length == 0) {
                        this.attackflow_json = JSON.parse(this.incidents[0].attackflow_json);
                        this.buildDiagram(this.attackflow_json);
                    }

                    this.updateCurrentPageButtons();
                    if (this.maxVersion.length == 0) {
                        this.maxVersion = Array.from({length: this.version}, (_, index) => index + 1).sort((a, b) => b-a);
                    }
                }
            };
            req.open('GET', `/users/incident/${id}?version=${version}`);
            req.send();
        },
        updateNumberOfIncidentsPendingApproval() {
            let req = new XMLHttpRequest();

            req.onreadystatechange = () => {  // Arrow function to retain the value of `this`
                if (req.readyState == 4 && req.status == 200) {
                    this.numberOfIncidentsPendingApproval = JSON.parse(req.responseText).total;
                }
            };
            req.open('GET', '/users/incidents/approval/number');
            req.send();
        },
        submitIncident(id, version, uploadFile) {
            this.loading = true;
            if (this.attachmentName == "No file uploaded...") {
                this.attachmentUploadWarning = true;
                return;
            }

            let req = new XMLHttpRequest();

            req.onreadystatechange = () => {  // Arrow function to retain the value of `this`
                if (req.readyState == 4 && req.status == 200) {
                    if (uploadFile) {
                        const { fileInput } = this.$refs;
                        const file = fileInput.files[0];
                        this.uploadFile(file, req.responseText, version);
                    } else {
                        this.submitAnnotation(true, false);
                    }
                }
            };
            let incident = {
                id: this.incidentId,
                version: this.version == -1 || this.version != this.maxVersion[0] ? this.maxVersion[0] : this.version,
                dateReported: new Date(this.dateReported).toISOString(),
                briefDescription: this.briefDescription
            };
            if (!uploadFile) {
                incident.attachmentPath = this.attachmentPath;
            }
            req.open('POST', '/users/incidents');
            req.setRequestHeader('Content-Type', 'application/json');
            req.send(JSON.stringify(incident));
        },
        annotateIncident(incidentId, version) {
            if (version == -1) {
                version = 1;
            }
            this.incidentId = incidentId;
            this.version = version;

            let req = new XMLHttpRequest();

            req.onreadystatechange = () => {  // Arrow function to retain the value of `this`
                if (req.readyState == 4 && req.status == 200) {
                    let basicData = JSON.parse(req.responseText);
                    if (basicData.dateAttack == "unknown") {
                        this.dateAttack = "";
                    } else {
                        try {
                            const formatter = new Intl.DateTimeFormat(navigator.language, {
                                year: "numeric",
                                month: "numeric",
                                day: "numeric"
                            });
                            basicData.dateAttack = formatter.format(new Date(basicData.dateAttack));
                            const dateAttackRaw = new Date(basicData.dateAttack);
                            let year = dateAttackRaw.toLocaleString("default", { year: "numeric" });
                            let month = dateAttackRaw.toLocaleString("default", { month: "2-digit" });
                            let day = dateAttackRaw.toLocaleString("default", { day: "2-digit" });
                            this.dateAttack = year + "-" + month + "-" + day;
                        } catch (error) {
                            this.dateAttack = "";
                        }

                    }
                    this.targets = basicData.targets;
                    this.attackers = basicData.attackers;
                    this.authors = basicData.authors;
                    this.summary = basicData.summary;

                    this.currentPage = 2.1;
                    this.loading = false;
                }
            };
            req.open('GET', `/users/incidents/annotation/${incidentId}?version=${version}`);
            req.send();
        },
        submitAnnotation(newVersion, generate) {
            this.loading = true;

            let req = new XMLHttpRequest();

            req.onreadystatechange = () => {  // Arrow function to retain the value of `this`
                if (req.readyState == 4 && req.status == 200) {
                    if (generate) {
                        this.generateAttackflowIncident(this.incidentId, this.version);
                    }

                    if (this.currentPage == 2.1) {
                        this.currentPage = 2.2;
                    } else {
                        this.submitIncidentAttackflow(true);
                    }
                }
            };
            let createWithVersion = this.version;
            if (newVersion) {
                createWithVersion = this.maxVersion[0] + 1;
            }
            let incident = {
                id: this.incidentId,
                version: createWithVersion,
                dateAttack: new Date(this.dateAttack).toISOString(),
                authors: this.authors,
                targets: this.targets,
                attackers: this.attackers,
                summary: this.summary
            };

            req.open('POST', '/users/incidents/annotation');
            req.setRequestHeader('Content-Type', 'application/json');
            req.send(JSON.stringify(incident));
        },
        generateAttackflowIncident(incidentId, version) {
            if (version == -1) {
                version = 1;
            }
            this.incidentId = incidentId;
            this.version = version;

            let req = new XMLHttpRequest();

            req.onreadystatechange = () => {  // Arrow function to retain the value of `this`
                if (req.readyState == 4 && req.status == 200) {
                    this.loading = false;
                    this.attackflow_json = JSON.parse(req.responseText);
                    this.buildDiagram(this.attackflow_json);
                }
            };
            req.open('GET', `/users/incidents/diagram/${incidentId}?version=${version}`);
            req.send();
        },
        submitIncidentAttackflow(newVersion) {
            // Send the file using an XMLHttpRequest
            const req = new XMLHttpRequest();

            req.onreadystatechange = () => {
                if (req.readyState === 4 && req.status == 200) {
                    this.currentPage = 1;
                    this.updateCurrentPageButtons();
                    this.loading = false;
                }
            };

            let createWithVersion = this.version;
            if (newVersion) {
                createWithVersion = this.maxVersion[0] + 1;
            }
            let incident = {
                id: this.incidentId,
                version: createWithVersion,
                attackflow_json: this.attackflow_json
            };

            req.open('POST', '/users/incidents/attackflow');
            req.setRequestHeader('Content-Type', 'application/json');
            req.send(JSON.stringify(incident));
        },
        uploadFile(file, id, version) {
        if (!file) {
            // Handle case when no file is selected
            return;
        }
        // Create a FormData object to send the file
        const formData = new FormData();
        formData.append('incidentAttachment', file);

        // Send the file using an XMLHttpRequest
        const req = new XMLHttpRequest();

        req.onreadystatechange = () => {
            if (req.readyState === 4 && req.status == 200) {
                console.log('File uploaded successfully');
                this.fetchDocument();
                this.annotateIncident(id, version);
            }
        };

        req.open('POST', '/users/upload/document');
        req.onerror = function () {
            // Handle network errors
            console.error('Error uploading file: Network error');
        };
        req.send(formData);
        },
        approveIncident(incidentId) //method for the approve button avaiable to Admins
        {
            let requestData = {
                incidentId: incidentId
              };

              let req = new XMLHttpRequest();

              req.onreadystatechange = () => {
                if (req.readyState == 4 && req.status == 200) {
                  // Handle success - maybe fetch the updated list of incidents
                  this.getIncidents();
                } else if (req.readyState == 4) {
                  alert('Failed to approve the incident');
                }
              };

              req.open('POST', '/users/approveIncident');
              req.setRequestHeader('Content-Type', 'application/json');
              req.send(JSON.stringify(requestData));
        },
        rejectIncident(incidentId) //method for the reject button avaiable to admins
        {
            let requestData = {
                incidentId: incidentId
              };

              let req = new XMLHttpRequest();

              req.onreadystatechange = () => {
                if (req.readyState == 4 && req.status == 200) {
                  // Handle success - maybe fetch the updated list of incidents
                  this.getIncidents();
                } else if (req.readyState == 4) {
                  alert('Failed to approve the incident');
                }
              };

              req.open('POST', '/users/rejectIncident');
              req.setRequestHeader('Content-Type', 'application/json');
              req.send(JSON.stringify(requestData));
        },
        buildDiagram(json) {
            // create a DiagramView component that wraps the "diagram" canvas
            var diagramView = MindFusion.Diagramming.DiagramView.create(document.getElementById("diagram"));

            let diagram = diagramView.diagram;
            let graph = json;

            let nodeMap = [];

            // load node data
            let nodes = graph.nodes;
            for (let node of nodes) {
                let diagramNode = diagram.factory.createShapeNode(0, 0, 18, 8);
                nodeMap[node.id] = diagramNode;
                diagramNode.text = node.name;
                diagramNode.brush = "#e0e9e9";
                diagramNode.resizeToFitText();
            }

            // load link data
            var links = graph.links;
            for (let link of links) {
                diagram.factory.createDiagramLink(
                    nodeMap[link.origin],
                    nodeMap[link.target]);
            }
            // arrange the graph
            var layout = new MindFusion.Graphs.LayeredLayout();
            layout.nodeDistance = 10;
            layout.layerDistance = 10;
            diagram.arrange(layout);
        },
        fetchDocument() {
            const req = new XMLHttpRequest();

            req.onreadystatechange = () => {
              if (req.readyState === 4) {
                if (req.status === 200) {
                    const response = JSON.parse(req.responseText);
                    const data = response[0];
                    this.attachmentPath = data[0].attachment_path;

                } else {
                  console.error('Error fetching document. Status:', req.status);
                }
              }
            };

            req.open('GET', '/users/getDocument');
            req.onerror = function() {
                console.error('Error fetching document: Network error');
            };
            req.send();
          }
    }
 }).mount("#app");