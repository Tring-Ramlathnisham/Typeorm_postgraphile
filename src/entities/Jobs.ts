import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Users } from "./Users";

export enum JobStatus {
    OPEN = "open",
    IN_PROGRESS = "in-progress",
    COMPLETED = "completed"
}

@Entity("jobs")
export class Jobs extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Users, (user) => user.jobs, { onDelete: "CASCADE" })
    client: Users;

    @Column({ type: "varchar", length: 255, nullable: false })
    title: string;

    @Column({ type: "text", nullable: false })
    description: string;

    @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
    budget: number;

    @Column({
        type: "enum",
        enum: JobStatus,
        default: JobStatus.OPEN
    })
    status: JobStatus;

    @CreateDateColumn({ type: "timestamp", default: () => "NOW()" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp", default: () => "NOW()" })
    updatedAt: Date;

    @DeleteDateColumn({ type: "timestamp", nullable: true })
    deletedAt: Date | null;

}
