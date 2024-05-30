App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
  
    init: async function() {
        await App.initWeb3();
    },
  
    initWeb3: async function() {
        if (window.ethereum) {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                App.web3Provider = window.ethereum;
                web3 = new Web3(App.web3Provider);
            } catch (error) {
                console.error("User denied account access", error);
                return;
            }
        } else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
            web3 = new Web3(App.web3Provider);
        } else {
            console.error("Non-Ethereum browser detected. You should consider trying MetaMask!");
            return;
        }
  
        if (!App.web3Provider) {
            console.error("No web3 provider found. Please install MetaMask.");
            return;
        }
  
        await App.initContract();
        App.render();
    },
  
    initContract: async function() {
        try {
            const response = await fetch("Contest.json");
            const contest = await response.json();
  
            App.contracts.Contest = TruffleContract(contest);
            App.contracts.Contest.setProvider(App.web3Provider);
  
            // Check if contract is deployed on the current network
          //  const networkId = await web3.eth.net.getId();
            const deployedNetwork = contest.networks[5777];
  
            /*if (deployedNetwork) {
                App.contracts.Contest.options.address = deployedNetwork.address;
            } else {
                console.error("Contract not found on this network.");
                return;
            }*/
        } catch (error) {
            console.error("Error loading contract JSON:", error);
        }
    },
  
    render: async function() {
        try {
            const contestInstance = await App.contracts.Contest.deployed();
            App.account = web3.eth.accounts[0]
            $("#accountAddress").html("Your account: " + App.account);
  
            const contestantsCount = await contestInstance.contestantsCount();
            const contestantsResults = $("#test");
            contestantsResults.empty();
            const contestantSelect = $("#contestantSelect");
            contestantSelect.empty();
  
            for (let i = 1; i <= contestantsCount; i++) {
                const contestant = await contestInstance.contestants(i);
                if (contestant && contestant.length) {
                    const id = contestant[0].toNumber();
                    const name = contestant[1];
                    const fetchedParty = contestant[3];
                    const fetchedAge = contestant[4];
                    const fetchedQualification = contestant[5];
  
                    const contestantTemplate = `
                        <div class='card' style='width: 15rem; margin: 1rem;'>
                            <div class='card-body text-center'>
                                <h4 class='card-title'>${name}</h4>
                                <button type='button' class='btn btn-info' data-toggle='modal' data-target='#modal${id}'>Click Here to Vote</button>
                                <div class='modal fade' id='modal${id}' tabindex='-1' role='dialog' aria-labelledby='exampleModalCenterTitle' aria-hidden='true'>
                                    <div class='modal-dialog modal-dialog-centered' role='document'>
                                        <div class='modal-content'>
                                            <div class='modal-header'>
                                                <h5 class='modal-title'><b>${name}</b></h5>
                                                <button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times;</span></button>
                                            </div>
                                            <div class='modal-body'><b> Party: ${fetchedParty}<br>Age: ${fetchedAge}<br>Qualification: ${fetchedQualification}<br></b></div>
                                            <div class='modal-footer'>
                                                <button class='btn btn-info' onClick='App.castVote(${id})'>VOTE</button>
                                                <button type='button' class='btn btn-info' data-dismiss='modal'>Close</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                    contestantsResults.append(contestantTemplate);
  
                    const contestantOption = `<option value='${id}'>${name}</option>`;
                    contestantSelect.append(contestantOption);
                }
            }
        } catch (error) {
            console.error("Error rendering contestants:", error);
        }
    },
  
    castVote: async function(id) {
        try {
            const contestInstance = await App.contracts.Contest.deployed();
            await contestInstance.vote(id, { from: App.account });
            console.log("Vote casted");
        } catch (error) {
            console.error("Error casting vote:", error);
        }
    },
  
    addCandidate: async function() {
        try {
            const name = $('#name').val();
            const age = $('#age').val();
            const party = $('#party').val();
            const qualification = $('#qualification').val();
  
            const contestInstance = await App.contracts.Contest.deployed();
            await contestInstance.addContestant(name, party, age, qualification);
            $('#name').val('');
            $('#age').val('');
            $('#party').val('');
            $('#qualification').val('');
        } catch (error) {
            console.error("Error adding candidate:", error);
        }
    },
  
    changeState: async function() {
        try {
            const contestInstance = await App.contracts.Contest.deployed();
            const currentState = await contestInstance.state();
            const newState = currentState.toNumber() + 1;
            await contestInstance.changeState(newState);
            $("#content").hide();
            $("#loader").show();
        } catch (error) {
            console.error("Error changing state:", error);
        }
    },
  
    registerVoter: async function() {
        try {
            const add = $('#accadd').val();
            debugger
            const contestInstance = App.contracts.Contest.deployed();
            await contestInstance.voterRegisteration(add);
            $("#content").hide();
            $("#loader").show();
        } catch (error) {
            console.error("Error registering voter:", error);
        }
    }
  };
  
  $(function() {
    $(window).load(function() {
        App.init();
    });
  });
  