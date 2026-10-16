package online.yudream.base.plugin.mcpanel.application.service;

import online.yudream.base.plugin.mcpanel.domain.aggregate.McpanelInstance;
import online.yudream.base.plugin.mcpanel.domain.repo.McpanelInstanceRepository;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 联动状态心跳：定期把已绑定子服的实例状态重新回推给 minecraft-server。
 *
 * <p>回推原本只在实例状态发生变化时发生，而 minecraft-server 侧用「面板确认实例在运行」
 * 作为线路探测全部不可达时的在线兜底依据（面板与节点同机部署时，面板经公网地址访问
 * 自己的游戏端口常被网关 NAT 回环策略拒绝，玩家从外网访问却正常）。回推一旦过期
 * （面板重启后内存态为空、实例长时间无状态变化）兜底即失效，列表又回到「明明在跑却显示离线」。
 * 因此这里按周期重推，保证兜底依据持续新鲜。
 */
public class MinecraftLinkHeartbeat implements AutoCloseable {

    private static final long INTERVAL_SECONDS = 60;

    private final McpanelInstanceRepository instances;
    private final MinecraftLinkService link;
    private ScheduledExecutorService scheduler;

    public MinecraftLinkHeartbeat(McpanelInstanceRepository instances, MinecraftLinkService link) {
        this.instances = instances;
        this.link = link;
    }

    public synchronized void start() {
        if (scheduler != null) {
            return;
        }
        scheduler = Executors.newSingleThreadScheduledExecutor(task -> {
            Thread thread = new Thread(task, "mcpanel-link-heartbeat");
            thread.setDaemon(true);
            return thread;
        });
        scheduler.scheduleWithFixedDelay(this::pulseSafely, INTERVAL_SECONDS, INTERVAL_SECONDS, TimeUnit.SECONDS);
    }

    /** 单次心跳：只回推已绑定子服的实例；链接不可用/异常只日志，不影响面板主流程。 */
    void pulseSafely() {
        try {
            for (McpanelInstance instance : instances.findAll()) {
                if (instance.mcServerId() == null || instance.mcServerId().isBlank()) {
                    continue;
                }
                link.writebackState(instance);
            }
        } catch (RuntimeException | Error error) {
            System.err.println("[mcpanel] 联动状态心跳失败: " + error);
        }
    }

    @Override
    public synchronized void close() {
        if (scheduler != null) {
            scheduler.shutdownNow();
            scheduler = null;
        }
    }
}
