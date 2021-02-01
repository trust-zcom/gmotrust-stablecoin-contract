#!/bin/sh
#If permission denied, please use chmod +x tasks.sh
# use case: ./tasks.sh {network} {action}
# for network
#   production -> production environment
#   ropsten -> ropsten environment
# for action
#   1 -> deploy Token_v2
#   2 -> upgrade to V2 and change deployer
#   3 -> validate V1 states of GYEN and ZUSD
#   4 -> validate V2 states of GYEN and ZUSD
if [[ $# != 2 ]]; then
    echo "use case: "
    echo " ./tasks {network} {action}"
    echo "      network example: production, ropsten"
    echo "      action example: 1, 2, 3, 4"
    echo "             1 -> deploy Token_v2"
    echo "             2 -> upgrade to V2 and change deployer"
    echo "             3 -> validate V1 states of GYEN and ZUSD"
    echo "             4 -> validate V2 states of GYEN and ZUSD" 
    exit
fi

case $2 in
    1)
        # use old deployer or other account
        npx truffle migrate --network $1  --f 6 --to 6
        ;;

    2)
        # must use old deployer
        npx truffle migrate --network $1  --f 7 --to 7
        ;;

    3)
        # must not use old deployer
        npx truffle exec ./validate_contract.js 1 --network $1
        ;;

    4)
        # must not use new deployer
        npx truffle exec ./validate_contract.js 2 --network $1
        ;;

    *)
        echo "./tasks.sh $1 {action}"
        echo "  action parameter error. Only 1, 2, 3, 4 are permitted."
esac