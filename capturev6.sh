#!/bin/sh

echo "output to $HOME"

/Applications/Wireshark.app/Contents/MacOS/tshark -a duration:1600 -B 4096 -i en0 -f "ip dst $1 or ip6 src $2" -T fields -e frame.time_relative -e frame.len -o data.show_as_text:TRUE -l  > "$HOME/tshark_in.txt" &

/Applications/Wireshark.app/Contents/MacOS/tshark -a duration:1600 -B 4096 -i en0 -f "ip src $1 or ip6 src $2" -T fields -e frame.time_relative -e frame.len -o data.show_as_text:TRUE -l  > "$HOME/tshark_out.txt" &

# Wait for both processes to finish
wait
